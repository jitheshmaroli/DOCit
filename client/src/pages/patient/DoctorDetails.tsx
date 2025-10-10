import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify'; // Keep for action-specific toasts
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
import RefreshIcon from '@mui/icons-material/Refresh';
import { ITEMS_PER_PAGE } from '../../utils/constants';

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
  } = useAppSelector((state) => state.doctors);
  const {
    activeSubscriptions,
    appointments,
    totalItems,
    canBookFree,
    loading: patientLoading,
    lastRefundDetails,
  } = useAppSelector((state) => state.patient);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [currentTimeSlots, setCurrentTimeSlots] = useState<TimeSlot[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<null | {
    id: string;
    price: number;
  }>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(
    null
  );
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCancelSubscriptionModalOpen, setIsCancelSubscriptionModalOpen] =
    useState(false);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [modalMode, setModalMode] = useState<'cancel' | 'refund'>('cancel');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [subscriptionsLoaded, setSubscriptionsLoaded] = useState(false);

  const specialityFromState = (location.state as { speciality?: string[] })
    ?.speciality;

  const activeSubscription = useMemo(() => {
    if (!doctorId) return null;
    const subsForDoctor = activeSubscriptions.filter(
      (sub) => sub.plan.doctorId === doctorId && sub.createdAt
    );
    return (
      subsForDoctor.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })[0] || null
    );
  }, [activeSubscriptions, doctorId]);

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
    ) {
      return false;
    }
    const timeDiffMinutes =
      (new Date().getTime() -
        new Date(activeSubscription.createdAt).getTime()) /
      (1000 * 60);
    return timeDiffMinutes <= 30;
  }, [activeSubscription]);

  useEffect(() => {
    if (doctorId) {
      setSubscriptionsLoaded(false);
      dispatch(getPatientSubscriptionsThunk())
        .unwrap()
        .then(() => {
          setSubscriptionsLoaded(true);
        })
        .catch((error) => {
          console.error('Failed to fetch subscriptions:', error);
          // Let ToastManager handle the error via Redux
          setSubscriptionsLoaded(true);
        });

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
          if (Array.isArray(payload)) {
            const validAvailability = payload
              .filter((entry) => entry.timeSlots.length > 0)
              .map((entry) => ({
                date: entry.date.split('T')[0],
                timeSlots: entry.timeSlots.filter((slot) => !slot.isBooked),
              }));
            setAvailability(validAvailability);
            const dates = validAvailability
              .map((entry) => {
                const dateStr = entry.date;
                if (dateStr && !isNaN(new Date(dateStr).getTime())) {
                  const normalizedDate = DateUtils.formatToISO(
                    DateUtils.parseToUTC(dateStr)
                  ).split('T')[0];
                  const dateObj = new Date(normalizedDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (dateObj >= today) {
                    return normalizedDate;
                  }
                }
                return null;
              })
              .filter((date): date is string => date !== null);
            const uniqueDates = [...new Set(dates)];
            setAvailableDates(uniqueDates);
          } else {
            setAvailableDates([]);
            setAvailability([]);
            // Let ToastManager handle via Redux
          }
        } else {
          // Let ToastManager handle via Redux
          setAvailableDates([]);
          setAvailability([]);
        }
      });
      getDoctorReviews(doctorId)
        .then((reviews) => {
          setReviews(reviews);
        })
        .catch(() => {
          // Let ToastManager handle via Redux
          setReviews([]);
        });
    }
    return () => {
      dispatch(clearRefundDetails());
    };
  }, [dispatch, doctorId, currentPage]);

  // Removed useEffect for toasting doctorError, patientError, subscriptionStatus

  const handleSubscribe = async (planId: string, price: number) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const response = await dispatch(
      subscribeToPlanThunk({
        planId,
        price,
      })
    ).unwrap();
    setSelectedPlan({ id: planId, price });
    setClientSecret(response.clientSecret);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (details: PaymentDetails) => {
    setPaymentDetails(details);
    setIsPaymentModalOpen(false);
    setIsSuccessModalOpen(true);
    setSelectedPlan(null);
    setClientSecret(null);
    dispatch(getPatientSubscriptionsThunk());
    toast.success('Successfully subscribed to plan', {
      toastId: 'subscription-success',
      autoClose: 3000,
    });
  };

  const debouncedCancelSubscription = debounce(async () => {
    if (!doctorId || !activeSubscription?._id) {
      toast.error('No active subscription to cancel', {
        toastId: 'no-subscription-error',
      });
      setIsCancelSubscriptionModalOpen(false);
      return;
    }
    if (!cancellationReason.trim()) {
      toast.error('Please provide a cancellation reason', {
        toastId: 'cancellation-reason-error',
      });
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
      toast.success('Subscription cancelled successfully', {
        toastId: 'cancel-subscription-success',
      });
    } catch {
      // Error is handled by Redux and ToastManager
      setIsCancelSubscriptionModalOpen(false);
      setCancellationReason('');
    }
  }, 1000);

  const handleCancelSubscription = useCallback(() => {
    debouncedCancelSubscription();
  }, [debouncedCancelSubscription]);

  const handleCloseCancelSubscriptionModal = () => {
    setIsCancelSubscriptionModalOpen(false);
    setCancellationReason('');
    setModalMode('cancel');
    dispatch(clearRefundDetails());
  };

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    setPaymentDetails(null);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setBookingConfirmed(false);
    if (date) {
      const selectedAvail = availability.find((avail) => avail.date === date);
      const slots = selectedAvail
        ? selectedAvail.timeSlots.filter((slot) => {
            if (!slot.startTime || !slot.endTime || slot.isBooked) return false;
            const now = new Date();
            const slotDate = new Date(date);
            const endTime = new Date(`${date}T${slot.endTime}`);
            if (slotDate.toDateString() === now.toDateString()) {
              return endTime > now;
            }
            return slotDate >= now;
          })
        : [];
      setCurrentTimeSlots(slots);
    } else {
      setCurrentTimeSlots([]);
    }
  };

  const handleResetSelection = () => {
    setSelectedDate('');
    setSelectedSlot(null);
    setCurrentTimeSlots([]);
    setBookingConfirmed(false);
  };

  const handleBookAppointment = async (isFreeBooking: boolean = false) => {
    if (!selectedSlot || !selectedDate || !doctorId) {
      toast.error('Please select a date and time slot', {
        toastId: 'booking-selection-error',
      });
      return;
    }
    if (
      !isFreeBooking &&
      (!activeSubscription || activeSubscription.status !== 'active')
    ) {
      if (!canBookFreeAppointment) {
        toast.error(
          'Please subscribe to a plan or check free booking eligibility',
          { toastId: 'booking-eligibility-error' }
        );
        return;
      }
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
    toast.success('Appointment booked successfully', {
      toastId: 'booking-success',
      position: 'top-right',
      autoClose: 3000,
      theme: 'dark',
    });
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
          const validAvailability = payload
            .filter((entry) => entry.timeSlots.length > 0)
            .map((entry) => ({
              date: entry.date.split('T')[0],
              timeSlots: entry.timeSlots.filter((slot) => !slot.isBooked),
            }));
          setAvailability(validAvailability);
          const dates = validAvailability
            .map((entry) => {
              const dateStr = entry.date;
              if (dateStr && !isNaN(new Date(dateStr).getTime())) {
                const normalizedDate = DateUtils.formatToISO(
                  DateUtils.parseToUTC(dateStr)
                ).split('T')[0];
                const dateObj = new Date(normalizedDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (dateObj >= today) {
                  return normalizedDate;
                }
              }
              return null;
            })
            .filter((date): date is string => date !== null);
          const uniqueDates = [...new Set(dates)];
          setAvailableDates(uniqueDates);
          if (selectedDate) {
            const selectedAvail = validAvailability.find(
              (avail) => avail.date === selectedDate
            );
            const slots = selectedAvail
              ? selectedAvail.timeSlots.filter((slot) => {
                  if (!slot.startTime || !slot.endTime || slot.isBooked)
                    return false;
                  const now = new Date();
                  const slotDate = new Date(selectedDate);
                  const endTime = new Date(`${selectedDate}T${slot.endTime}`);
                  if (slotDate.toDateString() === now.toDateString()) {
                    return endTime > now;
                  }
                  return slotDate >= now;
                })
              : [];
            setCurrentTimeSlots(slots);
          }
        } else {
          setAvailableDates([]);
          setAvailability([]);
          setCurrentTimeSlots([]);
          // Let ToastManager handle via Redux
        }
      } else {
        // Let ToastManager handle via Redux
        setAvailableDates([]);
        setAvailability([]);
        setCurrentTimeSlots([]);
      }
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (doctorLoading || !subscriptionsLoaded) {
    return (
      <div className="text-white text-center py-8">
        Loading doctor details...
      </div>
    );
  }

  if (!selectedDoctor) {
    return <div className="text-white text-center py-8">Doctor not found</div>;
  }

  const upcomingAppointments = doctorAppointments.filter(
    (appt: Appointment) => appt.status !== 'cancelled'
  );

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const displaySpeciality = specialityFromState || selectedDoctor.speciality;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 py-8"
      key={doctorId}
    >
      <Modal
        isOpen={isCancelSubscriptionModalOpen}
        onClose={handleCloseCancelSubscriptionModal}
        title={
          modalMode === 'cancel' ? 'Cancel Subscription' : 'Refund Details'
        }
        footer={
          <div className="flex gap-4">
            {modalMode === 'cancel' ? (
              <>
                <button
                  onClick={handleCancelSubscription}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300"
                >
                  Confirm Cancellation
                </button>
                <button
                  onClick={handleCloseCancelSubscriptionModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
                >
                  Close
                </button>
              </>
            ) : (
              <button
                onClick={handleCloseCancelSubscriptionModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
              >
                Close
              </button>
            )}
          </div>
        }
      >
        <div className="text-gray-200 mb-4">
          {modalMode === 'cancel' ? (
            <>
              <p>
                Are you sure you want to cancel your subscription to{' '}
                {activeSubscription?.plan.name}? A full refund will be issued.
              </p>
              <div className="mt-4">
                <label
                  htmlFor="cancellationReason"
                  className="block text-sm font-medium text-gray-200"
                >
                  Cancellation Reason
                </label>
                <textarea
                  id="cancellationReason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 p-2"
                  rows={4}
                  placeholder="Please provide a reason for cancellation"
                />
              </div>
            </>
          ) : (
            <>
              <p>
                Your subscription has been cancelled, and a refund has been
                initiated to the card ending in{' '}
                {lastRefundDetails?.cardLast4 || 'N/A'} for ₹
                {lastRefundDetails?.amount.toFixed(2) || '0.00'}.
              </p>
              <p>Refund Id: {lastRefundDetails?.refundId}</p>
            </>
          )}
        </div>
      </Modal>
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={handleCloseSuccessModal}
        title="Payment Successful"
        footer={
          <div className="flex gap-4">
            <button
              onClick={handleCloseSuccessModal}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
            >
              Close
            </button>
          </div>
        }
      >
        <div className="text-gray-200 mb-4">
          <p>Thank you for your subscription!</p>
          <p>Payment Details:</p>
          <p>Amount: ₹{paymentDetails?.amount.toFixed(2) || 'N/A'}</p>
          <p>Payment ID: {paymentDetails?.paymentIntentId || 'N/A'}</p>
        </div>
      </Modal>
      <div className="container mx-auto px-4">
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Doctor Details</h2>
          <div className="flex flex-col md:flex-row gap-6">
            <img
              src={getImageUrl(selectedDoctor.profilePicture)}
              alt={selectedDoctor.name}
              className="w-[150px] h-[150px] rounded-full object-cover shadow-lg border-4 border-purple-500/50"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultAvatar;
              }}
            />
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Dr. {selectedDoctor.name}
              </h3>
              <p className="text-sm text-purple-300 mb-2">
                {displaySpeciality?.length
                  ? displaySpeciality
                  : 'Speciality N/A'}
              </p>
              <p className="text-sm text-gray-200 mb-2">
                Qualifications:{' '}
                {selectedDoctor.qualifications?.join(', ') || 'N/A'}
              </p>
              <p className="text-sm text-gray-200 mb-2">
                Total Experience: {selectedDoctor.totalExperience || 0} years
              </p>
              {selectedDoctor.experiences &&
                selectedDoctor.experiences.length > 0 && (
                  <div className="text-sm text-gray-200 mb-2">
                    <p className="font-semibold">Experience Details:</p>
                    <ul className="list-disc pl-5">
                      {selectedDoctor.experiences.map((exp, index) => (
                        <li key={index}>
                          {exp.hospitalName} - {exp.department} ({exp.years}{' '}
                          years)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              <div className="flex items-center mb-2">
                <p className="text-sm text-gray-200 mr-2">Average Rating:</p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${
                        selectedDoctor.averageRating &&
                        selectedDoctor.averageRating >= star - 0.5
                          ? 'text-yellow-400'
                          : 'text-gray-400'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-200 ml-2">
                  {selectedDoctor.averageRating !== undefined
                    ? selectedDoctor.averageRating.toFixed(1)
                    : 'No ratings yet'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Reviews</h2>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="border-b border-white/20 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${star <= review.rating ? 'text-yellow-400' : 'text-gray-400'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-300">
                      {typeof review.patientId === 'object' &&
                      review.patientId?.name
                        ? review.patientId.name
                        : 'Anonymous'}
                    </p>
                    {review.createdAt && (
                      <p className="text-sm text-gray-400">
                        {DateUtils.formatToLocal(review.createdAt)}
                      </p>
                    )}
                  </div>
                  <p className="text-white">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-300">No reviews yet.</p>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Subscription Plans
          </h2>
          {patientLoading ? (
            <p className="text-gray-300 text-center">Loading subscription...</p>
          ) : activeSubscription ? (
            <div
              className={`${
                activeSubscription.status === 'active'
                  ? 'bg-blue-500/20 border-blue-500'
                  : 'bg-red-500/20 border-red-500'
              } border rounded-lg p-4`}
            >
              <h4 className="text-lg font-semibold text-white">
                {activeSubscription.status === 'active' ? 'Active' : 'Expired'}{' '}
                Plan: {activeSubscription.plan.name}
              </h4>
              <p className="text-sm text-gray-200 mt-2">
                Description: {activeSubscription.plan.description || 'N/A'}
              </p>
              <p className="text-sm text-gray-200 mt-2">
                Price: ₹{activeSubscription.plan.price.toFixed(2)}
              </p>
              <p className="text-sm text-gray-200 mt-2">
                Validity:{' '}
                {activeSubscription.daysUntilExpiration ||
                  activeSubscription.plan.validityDays}{' '}
                days
              </p>
              <p className="text-sm text-gray-200 mt-2">
                Appointments: {activeSubscription.appointmentsLeft} /{' '}
                {activeSubscription.plan.appointmentCount}
              </p>
              <p className="text-sm text-gray-200 mt-2">
                Status: {activeSubscription.status}
              </p>
              {activeSubscription.status === 'active' &&
                canCancelSubscription && (
                  <button
                    onClick={() => setIsCancelSubscriptionModalOpen(true)}
                    className="mt-4 w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300"
                  >
                    Cancel Subscription
                  </button>
                )}
              {activeSubscription.status === 'expired' && (
                <p className="text-sm text-gray-200 mt-2">
                  This plan has expired
                  {activeSubscription.appointmentsLeft <= 0
                    ? ' because you have used all available appointments.'
                    : ' because the validity period has ended.'}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-300 text-center">No subscription found.</p>
          )}
          {plans.length > 0 &&
            (!activeSubscription || activeSubscription.status !== 'active') && (
              <div className="mt-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  Available Plans
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <div
                      key={plan._id}
                      className="bg-white/20 backdrop-blur-lg p-4 rounded-lg border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <h3 className="text-lg font-semibold text-white">
                        {plan.name || 'Unnamed Plan'}
                      </h3>
                      <p className="text-sm text-gray-200 mt-2">
                        {plan.description || 'No description'}
                      </p>
                      <p className="text-sm text-gray-200 mt-2">
                        Price: ₹{plan.price.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-200 mt-2">
                        Validity: {plan.validityDays} days
                      </p>
                      <p className="text-sm text-gray-200 mt-2">
                        Appointments: {plan.appointmentCount}
                      </p>
                      <p
                        className={`text-xs mt-2 inline-flex px-2 py-1 rounded-full ${
                          plan.status === 'approved'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}
                      >
                        {plan.status}
                      </p>
                      {plan.status === 'approved' && (
                        <button
                          onClick={() => handleSubscribe(plan._id, plan.price)}
                          className="mt-4 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
                        >
                          {activeSubscription?.plan._id === plan._id &&
                          activeSubscription?.status === 'expired'
                            ? 'Renew'
                            : 'Subscribe'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        {(activeSubscription && activeSubscription.status === 'active') ||
        canBookFreeAppointment ? (
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Book an Appointment
              </h2>
              <button
                onClick={handleResetSelection}
                className="text-white hover:text-purple-300 transition-colors duration-200"
                title="Reset date and slot selection"
              >
                <RefreshIcon />
              </button>
            </div>
            {bookingConfirmed && (
              <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-6">
                <p className="text-green-300 text-sm">
                  Appointment booked successfully! You can book another
                  appointment or view details below.
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
              <div className="flex gap-4 mt-4">
                {activeSubscription &&
                  activeSubscription.status === 'active' && (
                    <button
                      onClick={() => handleBookAppointment(false)}
                      className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-2 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-300"
                    >
                      Confirm Appointment (Subscribed)
                    </button>
                  )}
                {(!activeSubscription ||
                  activeSubscription.status !== 'active') &&
                  canBookFreeAppointment && (
                    <button
                      onClick={() => handleBookAppointment(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                    >
                      Book Free Appointment
                    </button>
                  )}
              </div>
            )}
          </div>
        ) : null}

        {doctorAppointments.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Appointments</h2>
            <div className="space-y-4">
              {upcomingAppointments.map((appt: Appointment) => (
                <div
                  key={appt._id}
                  className="bg-white/20 p-4 rounded-lg border border-white/20 flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm text-gray-200">
                      Date: {DateUtils.formatToLocal(appt.date)}
                    </p>
                    <p className="text-sm text-gray-200">
                      Time: {DateUtils.formatTimeToLocal(appt.startTime)} -{' '}
                      {DateUtils.formatTimeToLocal(appt.endTime)}
                    </p>
                    <p className="text-sm text-gray-200">
                      Status: {appt.status}
                    </p>
                    <p className="text-sm text-gray-200">
                      Type: {appt.isFreeBooking ? 'Free' : 'Subscribed'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        navigate(`/patient/appointment/${appt._id}`)
                      }
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                className="mt-6"
              />
            )}
          </div>
        )}

        {isPaymentModalOpen && selectedPlan && clientSecret && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl w-full max-w-md">
              <h2 className="text-xl font-bold text-white mb-4">
                Complete Payment
              </h2>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm
                  planId={selectedPlan.id}
                  price={selectedPlan.price}
                  onSuccess={handlePaymentSuccess}
                  onError={(error) => {
                    toast.error(error, { toastId: 'payment-error' });
                  }}
                />
              </Elements>
              <button
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setSelectedPlan(null);
                  setClientSecret(null);
                }}
                className="mt-4 w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDetails;
