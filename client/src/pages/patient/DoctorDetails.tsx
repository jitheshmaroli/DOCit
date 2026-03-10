/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  fetchDoctorByIdThunk,
  fetchDoctorPlansThunk,
  subscribeToPlanThunk,
} from '../../redux/thunks/doctorThunk';
import {
  getPatientSubscriptionsThunk,
  bookAppointmentThunk,
  getPatientAppointmentsForDoctorThunk,
  getDoctorAvailabilityThunk,
  cancelSubscriptionThunk,
  confirmSubscriptionThunk,
  resumePendingSubscriptionThunk,
} from '../../redux/thunks/patientThunk';
import { clearRefundDetails } from '../../redux/slices/patientSlice';
import defaultAvatar from '/images/avatar.png';
import { getImageUrl } from '../../utils/config';
import useAuth from '../../hooks/useAuth';
import SlotPicker from './SlotPicker';
import PaymentForm from './PaymentForm';
import { DateUtils } from '../../utils/DateUtils';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { TimeSlot, Appointment } from '../../types/authTypes';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { getDoctorReviews } from '../../services/patientService';
import { debounce } from 'lodash';
import { ITEMS_PER_PAGE } from '../../utils/constants';
import { showError, showSuccess } from '../../utils/toastConfig';
import {
  Star,
  Clock,
  Award,
  Stethoscope,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  RotateCcw,
  User,
  Loader2,
  XCircle,
  MessageSquare,
  BookOpen,
  CalendarDays,
} from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

interface Availability {
  date: string;
  timeSlots: TimeSlot[];
}
interface Review {
  _id?: string;
  patientId: string | { _id?: string; name: string };
  doctorId: string;
  appointmentId: string;
  rating: number;
  comment: string;
  createdAt?: string;
  updatedAt?: string;
  patientName?: string;
}
interface PaymentDetails {
  paymentIntentId: string;
  amount: number;
}

// Tab definition
type TabId = 'subscription' | 'book' | 'appointments' | 'reviews';
interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  badgeCount?: number;
}

// Status badge helper
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    active: 'badge bg-emerald-100 text-emerald-700',
    pending: 'badge bg-amber-100 text-amber-700',
    expired: 'badge bg-surface-muted text-text-muted',
    cancelled: 'badge bg-red-100 text-error',
    completed: 'badge bg-emerald-100 text-emerald-700',
  };
  return (
    <span className={map[status] || 'badge-neutral'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const DoctorDetails: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    selectedDoctor,
    doctorPlans,
    loading: doctorLoading,
  } = useAppSelector((s) => s.doctors);
  const {
    activeSubscriptions,
    appointments,
    totalItems,
    canBookFree,
    loading: patientLoading,
    lastRefundDetails,
  } = useAppSelector((s) => s.patient);

  const [activeTab, setActiveTab] = useState<TabId>('subscription');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [currentTimeSlots, setCurrentTimeSlots] = useState<TimeSlot[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);
  const [maxPollAttempts] = useState(30);
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    price: number;
  } | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(
    null
  );
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCancelSubscriptionModalOpen, setIsCancelSubscriptionModalOpen] =
    useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [modalMode, setModalMode] = useState<'cancel' | 'refund'>('cancel');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [subscriptionsLoaded, setSubscriptionsLoaded] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isResumingPayment, setIsResumingPayment] = useState(false);

  const specialityFromState = (location.state as { speciality?: string[] })
    ?.speciality;

  const activeSubscription = useMemo(() => {
    if (!doctorId) return null;
    const subs = activeSubscriptions.filter(
      (s) => s.plan.doctorId === doctorId && s.createdAt
    );
    return (
      subs.sort(
        (a, b) =>
          new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
      )[0] || null
    );
  }, [activeSubscriptions, doctorId]);

  const pendingSubscription = useMemo(() => {
    if (!doctorId || !paymentDetails) return null;
    return activeSubscriptions.find(
      (s) =>
        s.stripePaymentId === paymentDetails.paymentIntentId &&
        s.status === 'pending'
    );
  }, [activeSubscriptions, doctorId, paymentDetails]);

  const plans = useMemo(
    () => (doctorId ? doctorPlans[doctorId] || [] : []),
    [doctorId, doctorPlans]
  );
  const canBookFreeAppointment = doctorId ? canBookFree : false;
  const doctorAppointments = useMemo(
    () => (doctorId ? appointments[doctorId] || [] : []),
    [doctorId, appointments]
  );

  const canCancelSubscription = useMemo(() => {
    if (
      !activeSubscription ||
      activeSubscription.status !== 'active' ||
      !activeSubscription.createdAt
    )
      return false;
    if (
      activeSubscription.plan.appointmentCount -
        activeSubscription.appointmentsLeft >
      0
    )
      return false;
    return (
      (new Date().getTime() -
        new Date(activeSubscription.createdAt).getTime()) /
        60000 <=
      30
    );
  }, [activeSubscription]);

  // Determine if "Book" tab should be visible
  const canBook =
    (activeSubscription && activeSubscription.status === 'active') ||
    canBookFreeAppointment;

  const upcomingAppointments = doctorAppointments.filter(
    (a: Appointment) => a.status !== 'cancelled'
  );
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const tabs: Tab[] = [
    {
      id: 'subscription',
      label: 'Subscription',
      icon: <CreditCard size={15} />,
    },
    ...(canBook
      ? [
          {
            id: 'book' as TabId,
            label: 'Book',
            icon: <CalendarDays size={15} />,
          },
        ]
      : []),
    {
      id: 'appointments',
      label: 'Appointments',
      icon: <BookOpen size={15} />,
      badgeCount: upcomingAppointments.length || undefined,
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: <MessageSquare size={15} />,
      badgeCount: reviews.length || undefined,
    },
  ];

  const processAvailability = (
    payload: { date: string; timeSlots: TimeSlot[] }[]
  ) => {
    const valid = payload
      .filter((e) => e.timeSlots.length > 0)
      .map((e) => ({
        date: e.date.split('T')[0],
        timeSlots: e.timeSlots.filter((s) => !s.isBooked),
      }));
    setAvailability(valid);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = [
      ...new Set(
        valid
          .map((e) => {
            const d = DateUtils.formatToISO(DateUtils.parseToUTC(e.date)).split(
              'T'
            )[0];
            return new Date(d) >= today ? d : null;
          })
          .filter(Boolean) as string[]
      ),
    ];
    setAvailableDates(dates);
    return { valid, dates };
  };

  const pollConfirmSubscription = useCallback(
    async (planId: string, paymentIntentId: string) => {
      setIsPolling(true);
      setPollAttempts(0);
      await new Promise((r) => setTimeout(r, 2000));
      const poll = async () => {
        try {
          await dispatch(
            confirmSubscriptionThunk({ planId, paymentIntentId })
          ).unwrap();
          setIsPolling(false);
          setPollAttempts(0);
          if (pollingInterval) clearInterval(pollingInterval);
          dispatch(getPatientSubscriptionsThunk());
          setIsSuccessModalOpen(true);
          return true;
        } catch (error: any) {
          setPollAttempts((p) => p + 1);
          if (
            pollAttempts >= maxPollAttempts ||
            error.message !==
              'Subscription is still pending activation. Please wait a moment and try again.'
          ) {
            setIsPolling(false);
            setPollAttempts(0);
            if (pollingInterval) clearInterval(pollingInterval);
            showError(
              'Subscription confirmation timed out. Please refresh or contact support.'
            );
            return false;
          }
          return false;
        }
      };
      const success = await poll();
      if (!success) {
        const interval = setInterval(poll, 2000);
        setPollingInterval(interval);
      }
    },
    [dispatch, maxPollAttempts, pollAttempts, pollingInterval]
  );

  useEffect(() => {
    if (!doctorId) return;
    setSubscriptionsLoaded(false);
    dispatch(getPatientSubscriptionsThunk())
      .unwrap()
      .finally(() => setSubscriptionsLoaded(true));
    dispatch(fetchDoctorByIdThunk(doctorId));
    dispatch(fetchDoctorPlansThunk(doctorId));
    dispatch(
      getPatientAppointmentsForDoctorThunk({
        doctorId,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      })
    );
    dispatch(
      getDoctorAvailabilityThunk({ doctorId, startDate: new Date() })
    ).then((result) => {
      if (getDoctorAvailabilityThunk.fulfilled.match(result)) {
        const payload = result.payload as {
          date: string;
          timeSlots: TimeSlot[];
        }[];
        if (Array.isArray(payload)) processAvailability(payload);
        else {
          setAvailableDates([]);
          setAvailability([]);
        }
      }
    });
    getDoctorReviews(doctorId)
      .then(setReviews)
      .catch(() => setReviews([]));
    return () => {
      dispatch(clearRefundDetails());
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [dispatch, doctorId, currentPage, pollingInterval]);

  const handleSubscribe = async (planId: string, price: number) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const response = await dispatch(
      subscribeToPlanThunk({ planId, price })
    ).unwrap();
    setSelectedPlan({ id: planId, price });
    setClientSecret(response.clientSecret);
    setIsPaymentModalOpen(true);
  };

  const handleResumePayment = async (subscriptionId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setIsResumingPayment(true);
    try {
      const response = await dispatch(
        resumePendingSubscriptionThunk(subscriptionId)
      ).unwrap();
      setSelectedPlan({ id: response.planId, price: response.price });
      setClientSecret(response.clientSecret);
      setIsPaymentModalOpen(true);
    } catch (error: any) {
      showError(error.message || 'Failed to resume payment.');
      dispatch(getPatientSubscriptionsThunk());
    } finally {
      setIsResumingPayment(false);
    }
  };

  const handlePaymentSuccess = async (details: PaymentDetails) => {
    setPaymentDetails(details);
    setIsPaymentModalOpen(false);
    await pollConfirmSubscription(selectedPlan!.id, details.paymentIntentId);
  };

  const debouncedCancelSubscription = debounce(async () => {
    if (!doctorId || !activeSubscription?._id) {
      showError('No active subscription');
      setIsCancelSubscriptionModalOpen(false);
      return;
    }
    if (!cancellationReason.trim()) {
      showError('Please provide a cancellation reason');
      return;
    }
    try {
      await dispatch(
        cancelSubscriptionThunk({
          subscriptionId: activeSubscription._id,
          cancellationReason,
        })
      );
      dispatch(getPatientSubscriptionsThunk());
      setModalMode('refund');
      setCancellationReason('');
      showSuccess('Subscription cancelled successfully');
    } catch {
      setIsCancelSubscriptionModalOpen(false);
      setCancellationReason('');
    }
  }, 1000);

  const handleCancelSubscription = useCallback(() => {
    debouncedCancelSubscription();
  }, [debouncedCancelSubscription]);

  const handleCloseCancelModal = () => {
    setIsCancelSubscriptionModalOpen(false);
    setCancellationReason('');
    setModalMode('cancel');
    dispatch(clearRefundDetails());
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setBookingConfirmed(false);
    if (date) {
      const avail = availability.find((a) => a.date === date);
      const now = new Date();
      setCurrentTimeSlots(
        avail
          ? avail.timeSlots.filter((s) => {
              if (!s.startTime || !s.endTime || s.isBooked) return false;
              const slotDate = new Date(date);
              const endTime = new Date(`${date}T${s.endTime}`);
              return slotDate.toDateString() === now.toDateString()
                ? endTime > now
                : slotDate >= now;
            })
          : []
      );
    } else setCurrentTimeSlots([]);
  };

  const handleBookAppointment = async (isFreeBooking = false) => {
    if (!selectedSlot || !selectedDate || !doctorId) {
      showError('Please select a date and time slot');
      return;
    }
    const bookingDate = DateUtils.parseToUTC(selectedDate);
    await dispatch(
      bookAppointmentThunk({
        doctorId,
        date: bookingDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        isFreeBooking,
      })
    ).unwrap();
    showSuccess('Appointment booked successfully');
    setBookingConfirmed(true);
    setSelectedSlot(null);
    dispatch(
      getPatientAppointmentsForDoctorThunk({
        doctorId,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      })
    );
    dispatch(getPatientSubscriptionsThunk());
    dispatch(
      getDoctorAvailabilityThunk({ doctorId, startDate: new Date() })
    ).then((result) => {
      if (getDoctorAvailabilityThunk.fulfilled.match(result)) {
        const payload = result.payload as {
          date: string;
          timeSlots: TimeSlot[];
        }[];
        if (Array.isArray(payload)) {
          const { valid } = processAvailability(payload);
          if (selectedDate) {
            const avail = valid.find((a) => a.date === selectedDate);
            const now = new Date();
            setCurrentTimeSlots(
              avail
                ? avail.timeSlots.filter((s) => {
                    if (!s.startTime || !s.endTime || s.isBooked) return false;
                    const slotDate = new Date(selectedDate);
                    const endTime = new Date(`${selectedDate}T${s.endTime}`);
                    return slotDate.toDateString() === now.toDateString()
                      ? endTime > now
                      : slotDate >= now;
                  })
                : []
            );
          }
        } else {
          setAvailableDates([]);
          setAvailability([]);
          setCurrentTimeSlots([]);
        }
      }
    });
  };

  // Loading / error states
  if (doctorLoading || !subscriptionsLoaded) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 size={36} className="animate-spin text-primary-500" />
        <p className="text-text-secondary text-sm">Loading doctor details...</p>
      </div>
    );
  }

  if (!selectedDoctor) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-muted flex items-center justify-center">
          <User size={28} className="text-text-muted" />
        </div>
        <h3 className="font-display font-bold text-text-primary text-xl">
          Doctor not found
        </h3>
        <button onClick={() => navigate(-1)} className="btn-primary">
          Go back
        </button>
      </div>
    );
  }

  const displaySpeciality = specialityFromState || selectedDoctor.speciality;

  return (
    <div className="animate-fade-in" key={doctorId}>
      {/* ── Cancel subscription modal ── */}
      <Modal
        isOpen={isCancelSubscriptionModalOpen}
        onClose={handleCloseCancelModal}
        title={
          modalMode === 'cancel' ? 'Cancel Subscription' : 'Refund Initiated'
        }
        description={
          modalMode === 'cancel' ? 'This action cannot be undone.' : undefined
        }
        footer={
          modalMode === 'cancel' ? (
            <>
              <button
                onClick={handleCloseCancelModal}
                className="btn-secondary"
              >
                Keep Plan
              </button>
              <button onClick={handleCancelSubscription} className="btn-danger">
                Confirm Cancellation
              </button>
            </>
          ) : (
            <button onClick={handleCloseCancelModal} className="btn-secondary">
              Close
            </button>
          )
        }
      >
        {modalMode === 'cancel' ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
              <AlertCircle
                size={16}
                className="text-warning flex-shrink-0 mt-0.5"
              />
              <p className="text-sm text-amber-700">
                You're about to cancel{' '}
                <strong>{activeSubscription?.plan.name}</strong>. A full refund
                will be issued.
              </p>
            </div>
            <div>
              <label className="label">
                Cancellation Reason <span className="text-error">*</span>
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="input resize-none"
                rows={3}
                placeholder="Please tell us why you're cancelling..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
              <CheckCircle
                size={16}
                className="text-success flex-shrink-0 mt-0.5"
              />
              <p className="text-sm text-emerald-700">
                Subscription cancelled. Refund has been initiated.
              </p>
            </div>
            <div className="card p-4 space-y-2">
              <p className="text-sm text-text-secondary">
                Card ending in{' '}
                <strong className="text-text-primary">
                  {lastRefundDetails?.cardLast4 || 'N/A'}
                </strong>
              </p>
              <p className="text-sm text-text-secondary">
                Refund amount:{' '}
                <strong className="text-text-primary">
                  ₹{lastRefundDetails?.amount.toFixed(2) || '0.00'}
                </strong>
              </p>
              <p className="text-xs text-text-muted">
                Refund ID: {lastRefundDetails?.refundId}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Subscription success modal ── */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          setPaymentDetails(null);
          setPollAttempts(0);
          if (pollingInterval) clearInterval(pollingInterval);
        }}
        title="Subscription Confirmed!"
        footer={
          <button
            onClick={() => {
              setIsSuccessModalOpen(false);
              setPaymentDetails(null);
            }}
            className="btn-primary"
          >
            Done
          </button>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
            <CheckCircle
              size={16}
              className="text-success flex-shrink-0 mt-0.5"
            />
            <p className="text-sm text-emerald-700">
              Your subscription is now active. You can book appointments right
              away.
            </p>
          </div>
          <div className="card p-4 space-y-1.5">
            <p className="text-sm text-text-secondary">
              Amount paid:{' '}
              <strong className="text-text-primary">
                ₹{paymentDetails?.amount.toFixed(2) || 'N/A'}
              </strong>
            </p>
            <p className="text-xs text-text-muted font-mono">
              ID: {paymentDetails?.paymentIntentId || 'N/A'}
            </p>
          </div>
        </div>
      </Modal>

      {/* ── Polling modal ── */}
      <Modal
        isOpen={isPolling}
        onClose={() => {}}
        title="Confirming Subscription"
      >
        <div className="flex flex-col items-center py-6 gap-4">
          <Loader2 size={36} className="animate-spin text-primary-500" />
          <div className="text-center">
            <p className="text-sm font-semibold text-text-primary mb-1">
              Processing your payment
            </p>
            <p className="text-xs text-text-muted">
              This usually takes 5–10 seconds. Please don't close this window.
            </p>
          </div>
        </div>
      </Modal>

      {/* ── Doctor profile ── */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-shrink-0">
            <img
              src={getImageUrl(selectedDoctor.profilePicture)}
              alt={selectedDoctor.name}
              className="w-28 h-28 rounded-2xl object-cover border border-surface-border shadow-card"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultAvatar;
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
              <h1 className="font-display font-bold text-text-primary text-2xl">
                Dr. {selectedDoctor.name}
              </h1>
              {selectedDoctor.averageRating !== undefined && (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-full px-3 py-1">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="text-sm font-bold text-amber-700">
                    {selectedDoctor.averageRating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {displaySpeciality && (
                <span className="badge-primary flex items-center gap-1">
                  <Stethoscope size={12} />{' '}
                  {Array.isArray(displaySpeciality)
                    ? displaySpeciality.join(', ')
                    : displaySpeciality}
                </span>
              )}
              <span className="badge-neutral flex items-center gap-1">
                <Clock size={12} /> {selectedDoctor.totalExperience || 0} yrs
                experience
              </span>
            </div>

            {(selectedDoctor.qualifications?.length ?? 0) > 0 && (
              <div className="flex items-start gap-2 mb-3">
                <Award
                  size={14}
                  className="text-text-muted flex-shrink-0 mt-0.5"
                />
                <p className="text-sm text-text-secondary">
                  {selectedDoctor.qualifications!.join(', ')}
                </p>
              </div>
            )}

            {(selectedDoctor.experiences?.length ?? 0) > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Experience
                </p>
                <div className="space-y-1.5">
                  {selectedDoctor.experiences!.map((exp: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-text-secondary"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                      {exp.hospitalName} — {exp.department} ({exp.years} yrs)
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    className={
                      selectedDoctor.averageRating &&
                      selectedDoctor.averageRating >= s - 0.5
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-surface-border text-surface-border'
                    }
                  />
                ))}
              </div>
              <span className="text-sm text-text-muted">
                {selectedDoctor.averageRating !== undefined
                  ? `${selectedDoctor.averageRating.toFixed(1)} / 5`
                  : 'No ratings yet'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="card mb-6 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-surface-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 bg-primary-50/50'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-bg'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                <span
                  className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-surface-muted text-text-muted'
                  }`}
                >
                  {tab.badgeCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {/* ── Subscription tab ── */}
          {activeTab === 'subscription' && (
            <div>
              {patientLoading ? (
                <div className="flex items-center justify-center py-8 gap-3">
                  <Loader2
                    size={20}
                    className="animate-spin text-primary-500"
                  />
                  <span className="text-sm text-text-muted">
                    Loading subscription...
                  </span>
                </div>
              ) : activeSubscription ? (
                <div
                  className={`rounded-2xl p-5 border ${
                    activeSubscription.status === 'active'
                      ? 'bg-emerald-50 border-emerald-200'
                      : activeSubscription.status === 'pending'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-surface-muted border-surface-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-display font-bold text-text-primary">
                        {activeSubscription.plan.name}
                      </p>
                      <p className="text-sm text-text-secondary mt-0.5">
                        {activeSubscription.plan.description ||
                          'No description'}
                      </p>
                    </div>
                    <StatusBadge status={activeSubscription.status} />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {[
                      {
                        label: 'Price',
                        value: `₹${activeSubscription.plan.price.toFixed(2)}`,
                      },
                      {
                        label: 'Validity',
                        value: `${activeSubscription.daysUntilExpiration || activeSubscription.plan.validityDays} days`,
                      },
                      {
                        label: 'Appointments',
                        value: `${activeSubscription.appointmentsLeft} / ${activeSubscription.plan.appointmentCount}`,
                      },
                      { label: 'Status', value: activeSubscription.status },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="bg-white rounded-xl p-3 border border-surface-border"
                      >
                        <p className="text-xs text-text-muted mb-0.5">
                          {label}
                        </p>
                        <p className="text-sm font-semibold text-text-primary capitalize">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {activeSubscription.status === 'pending' && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 p-3 bg-amber-100 rounded-xl">
                        <AlertCircle
                          size={15}
                          className="text-warning flex-shrink-0 mt-0.5"
                        />
                        <p className="text-xs text-amber-700">
                          Payment incomplete. Complete it to activate your
                          subscription.
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleResumePayment(activeSubscription._id)
                        }
                        disabled={isResumingPayment}
                        className="btn-primary w-full"
                      >
                        {isResumingPayment ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />{' '}
                            Resuming...
                          </>
                        ) : (
                          <>
                            <CreditCard size={15} /> Resume Payment
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {activeSubscription.status === 'active' &&
                    canCancelSubscription && (
                      <button
                        onClick={() => setIsCancelSubscriptionModalOpen(true)}
                        className="btn-danger w-full mt-2"
                      >
                        <XCircle size={15} /> Cancel Subscription
                      </button>
                    )}

                  {activeSubscription.status === 'expired' && (
                    <p className="text-xs text-text-muted mt-2">
                      {activeSubscription.appointmentsLeft <= 0
                        ? 'All appointments used.'
                        : 'Validity period ended.'}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-text-secondary">
                    No active subscription for this doctor.
                  </p>
                </div>
              )}

              {/* Available plans */}
              {plans.length > 0 &&
                (!activeSubscription ||
                  activeSubscription.status !== 'active') && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-text-primary mb-4">
                      Available Plans
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {plans.map((plan: any) => (
                        <div
                          key={plan._id}
                          className="card p-5 flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-display font-bold text-text-primary">
                              {plan.name || 'Unnamed Plan'}
                            </h4>
                            <span
                              className={
                                plan.status === 'approved'
                                  ? 'badge-success'
                                  : 'badge-neutral'
                              }
                            >
                              {plan.status}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary flex-1">
                            {plan.description || 'No description'}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              {
                                label: 'Price',
                                value: `₹${plan.price.toFixed(2)}`,
                              },
                              {
                                label: 'Validity',
                                value: `${plan.validityDays}d`,
                              },
                              {
                                label: 'Appointments',
                                value: plan.appointmentCount,
                              },
                            ].map(({ label, value }) => (
                              <div
                                key={label}
                                className="bg-surface-bg rounded-lg p-2 border border-surface-border"
                              >
                                <p className="text-xs text-text-muted">
                                  {label}
                                </p>
                                <p className="text-sm font-semibold text-text-primary">
                                  {value}
                                </p>
                              </div>
                            ))}
                          </div>
                          {plan.status === 'approved' && (
                            <button
                              onClick={() =>
                                handleSubscribe(plan._id, plan.price)
                              }
                              className="btn-primary w-full"
                            >
                              {activeSubscription?.plan._id === plan._id &&
                              activeSubscription?.status === 'expired'
                                ? 'Renew Plan'
                                : 'Subscribe'}
                              <ChevronRight size={15} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* ── Book appointment tab ── */}
          {activeTab === 'book' && canBook && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-bold text-text-primary text-xl">
                  Book an Appointment
                </h2>
                <button
                  onClick={() => {
                    setSelectedDate('');
                    setSelectedSlot(null);
                    setCurrentTimeSlots([]);
                    setBookingConfirmed(false);
                  }}
                  className="btn-ghost text-sm flex items-center gap-1.5"
                >
                  <RotateCcw size={14} /> Reset
                </button>
              </div>

              {bookingConfirmed && (
                <div className="flex items-start gap-3 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl mb-5">
                  <CheckCircle
                    size={16}
                    className="text-success flex-shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-emerald-700">
                    Appointment booked! You can book another or view it in the
                    Appointments tab.
                  </p>
                </div>
              )}

              <SlotPicker
                availableDates={availableDates}
                selectedDate={selectedDate}
                currentTimeSlots={currentTimeSlots}
                selectedSlot={selectedSlot}
                onDateChange={handleDateChange}
                onSlotSelect={setSelectedSlot}
                patientLoading={patientLoading}
              />

              {selectedSlot && (
                <div className="flex flex-col sm:flex-row gap-3 mt-5">
                  {activeSubscription?.status === 'active' && (
                    <button
                      onClick={() => handleBookAppointment(false)}
                      className="btn-primary flex-1"
                    >
                      <Calendar size={15} /> Confirm Appointment
                    </button>
                  )}
                  {pendingSubscription?.status === 'pending' && (
                    <button
                      disabled
                      className="btn-secondary flex-1 opacity-60 cursor-not-allowed"
                    >
                      <Loader2 size={15} className="animate-spin" /> Awaiting
                      Subscription...
                    </button>
                  )}
                  {(!activeSubscription ||
                    activeSubscription.status !== 'active') &&
                    canBookFreeAppointment && (
                      <button
                        onClick={() => handleBookAppointment(true)}
                        className="btn-secondary flex-1"
                      >
                        <Calendar size={15} /> Book Free Appointment
                      </button>
                    )}
                </div>
              )}
            </div>
          )}

          {/* ── Appointments tab ── */}
          {activeTab === 'appointments' && (
            <div>
              <h2 className="font-display font-bold text-text-primary text-xl mb-5">
                Your Appointments
              </h2>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center mx-auto mb-3">
                    <CalendarDays size={20} className="text-text-muted" />
                  </div>
                  <p className="text-sm text-text-secondary">
                    No appointments yet.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {upcomingAppointments.map((appt: Appointment) => (
                      <div
                        key={appt._id}
                        className="flex items-center justify-between gap-4 p-4 bg-surface-bg rounded-xl border border-surface-border hover:border-primary-200 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-1">
                            <span className="text-sm font-semibold text-text-primary">
                              {DateUtils.formatToLocal(appt.date)}
                            </span>
                            <StatusBadge status={appt.status} />
                            <span
                              className={`badge ${appt.isFreeBooking ? 'bg-teal-100 text-teal-700' : 'badge-primary'}`}
                            >
                              {appt.isFreeBooking ? 'Free' : 'Subscribed'}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted">
                            {DateUtils.formatTimeToLocal(appt.startTime)} –{' '}
                            {DateUtils.formatTimeToLocal(appt.endTime)}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            navigate(`/patient/appointment/${appt._id}`)
                          }
                          className="btn-secondary text-sm flex-shrink-0"
                        >
                          <ChevronRight size={15} /> Details
                        </button>
                      </div>
                    ))}
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    className="mt-6"
                  />
                </>
              )}
            </div>
          )}

          {/* ── Reviews tab ── */}
          {activeTab === 'reviews' && (
            <div>
              <h2 className="font-display font-bold text-text-primary text-xl mb-5">
                Reviews ({reviews.length})
              </h2>
              {reviews.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center mx-auto mb-3">
                    <Star size={20} className="text-text-muted" />
                  </div>
                  <p className="text-sm text-text-secondary">No reviews yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review._id}
                      className="p-4 bg-surface-bg rounded-xl border border-surface-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs">
                            {(typeof review.patientId === 'object'
                              ? review.patientId.name
                              : 'A'
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-text-primary">
                            {typeof review.patientId === 'object' &&
                            review.patientId?.name
                              ? review.patientId.name
                              : 'Anonymous'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={12}
                              className={
                                s <= review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-surface-border text-surface-border'
                              }
                            />
                          ))}
                          {review.createdAt && (
                            <span className="text-xs text-text-muted ml-2">
                              {DateUtils.formatToLocal(review.createdAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Payment modal ── */}
      {isPaymentModalOpen && selectedPlan && clientSecret && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal border border-surface-border w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
              <div>
                <h2 className="font-display font-bold text-text-primary">
                  Complete Payment
                </h2>
                <p className="text-sm text-text-secondary mt-0.5">
                  ₹{selectedPlan.price.toFixed(2)} due today
                </p>
              </div>
              <CreditCard size={20} className="text-primary-500" />
            </div>
            <div className="p-6">
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm
                  planId={selectedPlan.id}
                  price={selectedPlan.price}
                  onSuccess={handlePaymentSuccess}
                  onError={(error: any) => showError(error)}
                  isResume={isResumingPayment}
                />
              </Elements>
              <button
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setSelectedPlan(null);
                  setClientSecret(null);
                  setIsResumingPayment(false);
                  dispatch(getPatientSubscriptionsThunk());
                }}
                className="btn-ghost w-full mt-3 justify-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDetails;
