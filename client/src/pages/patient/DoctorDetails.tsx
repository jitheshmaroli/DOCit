import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  fetchDoctorByIdThunk,
  fetchDoctorPlansThunk,
  subscribeToPlanThunk,
} from '../../redux/thunks/doctorThunk';
import {
  getPatientSubscriptionThunk,
  bookAppointmentThunk,
  getPatientAppointmentsForDoctorThunk,
  getDoctorAvailabilityThunk,
  cancelAppointmentThunk,
} from '../../redux/thunks/patientThunk';
import { clearError as clearDoctorError } from '../../redux/slices/doctorSlice';
import { clearError as clearPatientError } from '../../redux/slices/patientSlice';
import defaultAvatar from '/images/avatar.png';
import { getImageUrl } from '../../utils/config';
import useAuth from '../../hooks/useAuth';
import SlotPicker from './SlotPicker';
import PaymentForm from './PaymentForm';
import { DateUtils } from '../../utils/DateUtils';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { TimeSlot } from '../../types/authTypes';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

interface Availability {
  date: string;
  timeSlots: TimeSlot[];
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
    loading,
    error: doctorError,
    subscriptionStatus,
  } = useAppSelector((state) => state.doctors);
  const {
    activeSubscriptions,
    appointments,
    canBookFree,
    loading: patientLoading,
    error: patientError,
  } = useAppSelector((state) => state.patient);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [currentTimeSlots, setCurrentTimeSlots] = useState<TimeSlot[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<null | {
    id: string;
    price: number;
  }>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Get speciality from location state
  const specialityFromState = (location.state as { speciality?: string[] })?.speciality;

  useEffect(() => {
    if (doctorId) {
      dispatch(fetchDoctorByIdThunk(doctorId));
      dispatch(fetchDoctorPlansThunk(doctorId));
      dispatch(getPatientSubscriptionThunk(doctorId));
      dispatch(getPatientAppointmentsForDoctorThunk(doctorId));
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
            toast.warn('No available dates found for this doctor');
          }
        } else {
          toast.error(
            (result.payload as string) || 'Failed to load available dates'
          );
          setAvailableDates([]);
          setAvailability([]);
        }
      });
    }
  }, [dispatch, doctorId]);

  useEffect(() => {
    if (doctorError) {
      toast.error(doctorError);
      dispatch(clearDoctorError());
    }
    if (patientError) {
      toast.error(patientError);
      dispatch(clearPatientError());
    }
    if (subscriptionStatus === 'success') {
      toast.success('Successfully subscribed to plan');
      dispatch(getPatientSubscriptionThunk(doctorId!));
      setIsPaymentModalOpen(false);
      setSelectedPlan(null);
      setClientSecret(null);
    } else if (subscriptionStatus === 'failed') {
      toast.error('Failed to subscribe to plan');
    }
  }, [doctorError, patientError, subscriptionStatus, dispatch, doctorId]);

  const handleSubscribe = async (planId: string, price: number) => {
    if (!user) {
      toast.error('Please log in to subscribe');
      navigate('/login');
      return;
    }
    try {
      const response = await dispatch(
        subscribeToPlanThunk({
          planId,
          price,
        })
      ).unwrap();
      setSelectedPlan({ id: planId, price });
      setClientSecret(response.clientSecret);
      setIsPaymentModalOpen(true);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to initiate payment';
      toast.error(errorMessage);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setBookingConfirmed(false);
    if (date) {
      const selectedAvail = availability.find((avail) => avail.date === date);
      const slots = selectedAvail
        ? selectedAvail.timeSlots.filter((slot) => {
            if (!slot.startTime || !slot.endTime) return false;
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

  const handleBookAppointment = async (isFreeBooking: boolean = false) => {
    if (!selectedSlot || !selectedDate || !doctorId) {
      toast.error('Please select a date and time slot');
      return;
    }
    const activeSubscription = activeSubscriptions[doctorId];
    if (
      !isFreeBooking &&
      (!activeSubscription ||
        activeSubscription.isExpired ||
        activeSubscription.appointmentsLeft <= 0)
    ) {
      if (!canBookFree) {
        toast.error(
          'Please subscribe to a plan or check free booking eligibility'
        );
        return;
      }
    }
    try {
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
        position: 'top-right',
        autoClose: 3000,
        theme: 'dark',
      });
      setBookingConfirmed(true);
      dispatch(getPatientAppointmentsForDoctorThunk(doctorId));
      dispatch(getPatientSubscriptionThunk(doctorId));
      setSelectedDate('');
      setSelectedSlot(null);
      setCurrentTimeSlots([]);
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
            toast.warn('No available dates found for this doctor');
          }
        }
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to book appointment: ${errorMessage}`);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!doctorId || !user?._id) {
      toast.error('User not authenticated');
      return;
    }
    // Add confirmation prompt
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this appointment?'
    );
    if (!confirmCancel) {
      return;
    }
    try {
      const appointment = appointments.find(
        (appt) => appt._id === appointmentId
      );
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      const createdAt = new Date(appointment.createdAt);
      const now = new Date();
      const minutesSinceBooking =
        (now.getTime() - createdAt.getTime()) / (1000 * 60);
      if (minutesSinceBooking > 30) {
        throw new Error(
          'Cancellation is only allowed within 30 minutes of booking'
        );
      }
      await dispatch(
        cancelAppointmentThunk(appointmentId)
      ).unwrap();
      toast.success('Appointment cancelled successfully');
      dispatch(getPatientAppointmentsForDoctorThunk(doctorId));
      dispatch(getPatientSubscriptionThunk(doctorId));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="text-white text-center py-8">
        Loading doctor details...
      </div>
    );
  }

  if (!selectedDoctor) {
    return <div className="text-white text-center py-8">Doctor not found</div>;
  }

  const activeSubscription = doctorId ? activeSubscriptions[doctorId] : null;
  const plans = doctorId ? doctorPlans[doctorId] || [] : [];
  const canBookFreeAppointment = doctorId ? canBookFree : false;

  const upcomingAppointments = appointments.filter((appt) => {
    return appt.status !== 'cancelled';
  });

  // Use speciality from state if available, otherwise fallback to selectedDoctor.speciality
  const displaySpeciality = specialityFromState || selectedDoctor.speciality;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 py-8">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="dark"
        className="fixed top-4 right-4 z-60"
      />
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
                {displaySpeciality?.length ? displaySpeciality.join(', ') : 'Speciality N/A'}
              </p>
              <p className="text-sm text-gray-200 mb-2">
                Qualifications:{' '}
                {selectedDoctor.qualifications?.join(', ') || 'N/A'}
              </p>
              <p className="text-sm text-gray-200 mb-2">
                Age: {selectedDoctor.age || 'N/A'} | Gender:{' '}
                {selectedDoctor.gender || 'N/A'}
              </p>
              <p className="text-sm text-gray-200">
                Availability: {selectedDoctor.availability || 'TBD'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Subscription Plans
          </h2>
          {patientLoading ? (
            <p className="text-gray-300 text-center">Loading subscription...</p>
          ) : activeSubscription &&
            activeSubscription.plan &&
            !activeSubscription.isExpired ? (
            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white">
                Active Plan: {activeSubscription.plan.name}
              </h4>
              <p className="text-sm text-gray-200 mt-2">
                Description: {activeSubscription.plan.description || 'N/A'}
              </p>
              <p className="text-sm text-gray-200 mt-2">
                Price: ₹{(activeSubscription.plan.price / 100).toFixed(2)}
              </p>
              <p className="text-sm text-gray-200 mt-2">
                Validity: {activeSubscription.daysUntilExpiration} days
                remaining
              </p>
              <p className="text-sm text-gray-200 mt-2">
                Appointments Left: {activeSubscription.appointmentsLeft} /{' '}
                {activeSubscription.plan.appointmentCount}
              </p>
              <p className="text-sm text-gray-200 mt-2">
                Status: {activeSubscription.status}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.length > 0 ? (
                plans.map((plan) => (
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
                      Price: ₹{(plan.price / 100).toFixed(2)}
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
                        Subscribe
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="col-span-full text-center text-gray-200">
                  No subscription plans available.
                </p>
              )}
            </div>
          )}
        </div>

        {(activeSubscription && !activeSubscription.isExpired) ||
        canBookFreeAppointment ? (
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Book an Appointment
            </h2>
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
                {activeSubscription && !activeSubscription.isExpired && (
                  <button
                    onClick={() => handleBookAppointment(false)}
                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-2 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-300"
                  >
                    Confirm Appointment (Subscribed)
                  </button>
                )}
                {canBookFreeAppointment && (
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

        {upcomingAppointments.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">
              Upcoming Appointments
            </h2>
            <div className="space-y-4">
              {upcomingAppointments.map((appt) => (
                <div
                  key={appt._id}
                  className="bg-white/20 p-4 rounded-lg border border-white/20"
                >
                  <p className="text-sm text-gray-200">
                    Date: {DateUtils.formatToLocal(appt.date)}
                  </p>
                  <p className="text-sm text-gray-200">
                    Time: {DateUtils.formatTimeToLocal(appt.startTime)} -{' '}
                    {DateUtils.formatTimeToLocal(appt.endTime)}
                  </p>
                  <p className="text-sm text-gray-200">Status: {appt.status}</p>
                  <p className="text-sm text-gray-200">
                    Type: {appt.isFreeBooking ? 'Free' : 'Subscribed'}
                  </p>
                  <button
                    onClick={() => handleCancelAppointment(appt._id)}
                    className="mt-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
                onSuccess={() => {
                  setIsPaymentModalOpen(false);
                  setSelectedPlan(null);
                  setClientSecret(null);
                  dispatch(getPatientSubscriptionThunk(doctorId!));
                }}
                onError={(error) => {
                  toast.error(error);
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
  );
};

export default DoctorDetails;