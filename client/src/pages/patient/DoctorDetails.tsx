import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from '../../redux/thunks/patientThunk';
import { clearError as clearDoctorError } from '../../redux/slices/doctorSlice';
import { clearError as clearPatientError } from '../../redux/slices/patientSlice';
import defaultAvatar from '/images/avatar.png';
import { API_BASE_URL } from '../../utils/config';
import useAuth from '../../hooks/useAuth';
import SlotPicker from './SlotPicker';
import { DateUtils } from '../../utils/DateUtils';

interface TimeSlot {
  startTime: string;
  endTime: string;
  _id?: string;
}

interface Availability {
  date?: string;
  availableDate?: string;
  slotDate?: string;
  timeSlots?: TimeSlot[];
  slots?: TimeSlot[];
  startTime?: string;
  endTime?: string;
  _id?: string;
}

const DoctorDetails: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    selectedDoctor,
    doctorPlans,
    loading: doctorsLoading,
    error: doctorError,
    subscriptionStatus,
  } = useAppSelector((state) => state.doctors);
  const {
    activeSubscriptions,
    appointments,
    loading: patientLoading,
    error: patientError,
  } = useAppSelector((state) => state.patient);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [currentTimeSlots, setCurrentTimeSlots] = useState<TimeSlot[]>([]);

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
          const payload = result.payload as Availability[];
          if (Array.isArray(payload)) {
            setAvailability(payload);
            const dates = payload
              .map((avail) => {
                const dateStr =
                  avail.date || avail.availableDate || avail.slotDate;
                if (dateStr && !isNaN(new Date(dateStr).getTime())) {
                  const normalizedDate = DateUtils.formatToISO(
                    DateUtils.parseToUTC(dateStr)
                  ).split('T')[0];
                  const dateObj = new Date(normalizedDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  // Only include dates that are today or in the future
                  if (dateObj >= today) {
                    const slots =
                      avail.timeSlots ||
                      avail.slots ||
                      (avail.startTime && avail.endTime
                        ? [
                            {
                              startTime: avail.startTime,
                              endTime: avail.endTime,
                              _id: avail._id,
                            },
                          ]
                        : []);
                    return slots.length > 0 ? normalizedDate : null;
                  }
                }
                return null;
              })
              .filter((date): date is string => date !== null);
            const uniqueDates = [...new Set(dates)];
            console.log('uniquedate:', uniqueDates);
            setAvailableDates(uniqueDates);
          } else {
            setAvailableDates([]);
            setAvailability([]);
            toast.warn('No available dates found for this doctor');
          }
        } else {
          toast.error('Failed to load available dates');
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
    } else if (subscriptionStatus === 'failed') {
      toast.error('Failed to subscribe to plan');
    }
  }, [doctorError, patientError, subscriptionStatus, dispatch, doctorId]);

  const handleSubscribe = (planId: string) => {
    if (!user) {
      toast.error('Please log in to subscribe');
      navigate('/login');
      return;
    }
    dispatch(subscribeToPlanThunk(planId));
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (date) {
      const selectedAvail = availability.find((avail) => {
        const dateStr = avail.date || avail.availableDate || avail.slotDate;
        return (
          dateStr &&
          DateUtils.formatToISO(DateUtils.parseToUTC(dateStr)).split('T')[0] ===
            date
        );
      });

      const slots = selectedAvail
        ? (
            selectedAvail.timeSlots ||
            selectedAvail.slots ||
            (selectedAvail.startTime && selectedAvail.endTime
              ? [
                  {
                    startTime: selectedAvail.startTime,
                    endTime: selectedAvail.endTime,
                    _id: selectedAvail._id,
                  },
                ]
              : [])
          ).filter((slot) => {
            // Filter out slots that have already passed
            if (!slot.startTime || !slot.endTime) return false;

            const now = new Date();
            const slotDate = new Date(date);
            const endTime = new Date(`${date}T${slot.endTime}`);

            // If the slot is today, check if it's in the future
            if (slotDate.toDateString() === now.toDateString()) {
              return endTime > now;
            }

            // For future dates, all slots are valid
            return slotDate > now;
          })
        : [];
      setCurrentTimeSlots(slots);
    } else {
      setCurrentTimeSlots([]);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot || !selectedDate || !doctorId) {
      toast.error('Please select a date and time slot');
      return;
    }

    const activeSubscription = activeSubscriptions[doctorId];
    if (!activeSubscription || activeSubscription.isExpired) {
      toast.error('Please subscribe to a plan to book an appointment');
      navigate(`/patient/doctors/${doctorId}`);
      return;
    }

    try {
      const bookingDate = DateUtils.parseToUTC(selectedDate);
      await dispatch(
        bookAppointmentThunk({
          doctorId,
          date: bookingDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          isFreeBooking: false,
        })
      ).unwrap();
      toast.success('Appointment booked successfully');
      navigate('/patient/profile');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to book appointment: ${errorMessage}`);
    }
  };

  if (!selectedDoctor) {
    return <div className="text-white text-center py-8">Loading...</div>;
  }

  const activeSubscription = doctorId ? activeSubscriptions[doctorId] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 py-8">
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="container mx-auto px-4">
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Doctor Details</h2>
          <div className="flex flex-col md:flex-row gap-6">
            <img
              src={
                selectedDoctor.profilePicture
                  ? `${API_BASE_URL}${selectedDoctor.profilePicture}`
                  : defaultAvatar
              }
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
                {selectedDoctor.speciality || 'Speciality N/A'}
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
              <p className="text-sm text-gray-300 mb-2">
                {activeSubscription.plan.description ||
                  'No description available'}
              </p>
              <p className="text-sm text-purple-300">
                Cost: ${activeSubscription.plan.appointmentCost} / appointment
              </p>
              <p className="text-sm text-green-300">
                Days Remaining: {activeSubscription.daysUntilExpiration}
              </p>
            </div>
          ) : (
            <>
              {activeSubscription && activeSubscription.isExpired ? (
                <p className="text-gray-300 text-center mb-4">
                  Your subscription has expired. Please subscribe to a new plan.
                </p>
              ) : (
                <p className="text-gray-300 text-center mb-4">
                  No active subscription. Choose a plan below to subscribe.
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctorId && doctorPlans[doctorId]?.length > 0 ? (
                  doctorPlans[doctorId].map((plan) => (
                    <div
                      key={plan._id}
                      className="bg-gradient-to-br from-purple-800/20 to-blue-800/20 p-4 rounded-lg border border-white/20 hover:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      <h3 className="text-lg font-semibold text-white">
                        {plan.name || 'Standard Plan'}
                      </h3>
                      <p className="text-gray-300 text-sm mb-2">
                        {plan.description || 'No description available'}
                      </p>
                      <p className="text-purple-300 font-bold mb-2">
                        ${plan.appointmentCost} / appointment
                      </p>
                      <p className="text-gray-300 text-sm mb-4">
                        Duration: {plan.duration} days
                      </p>
                      <button
                        onClick={() => handleSubscribe(plan._id)}
                        className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-2 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-300"
                        disabled={doctorsLoading}
                      >
                        {doctorsLoading ? 'Subscribing...' : 'Subscribe Now'}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-300 col-span-2 text-center">
                    No plans available for this doctor.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Previous Bookings
          </h2>
          {appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <div
                  key={appt._id}
                  className="bg-white/20 p-4 rounded-lg border border-white/20"
                >
                  <p className="text-sm text-gray-200">
                    Date:{' '}
                    {DateUtils.formatToLocalDisplay(
                      DateUtils.parseToUTC(appt.date)
                    )}
                  </p>
                  <p className="text-sm text-gray-200">
                    Time:{' '}
                    {DateUtils.formatTimeToLocal(
                      appt.startTime,
                      DateUtils.parseToUTC(appt.date)
                    )}{' '}
                    -{' '}
                    {DateUtils.formatTimeToLocal(
                      appt.endTime,
                      DateUtils.parseToUTC(appt.date)
                    )}
                  </p>
                  <p className="text-sm text-gray-200">
                    Type:{' '}
                    {appt.isFreeBooking ? 'Free Booking' : 'Subscribed Booking'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-300 text-center">No previous bookings</p>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">
            Book Appointment
          </h2>
          <SlotPicker
            timeSlots={currentTimeSlots}
            patientLoading={patientLoading}
            onDateChange={handleDateChange}
            onSlotSelect={setSelectedSlot}
            availableDates={availableDates}
            selectedDate={selectedDate}
          />
          <button
            onClick={handleBookAppointment}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 mt-4"
            disabled={patientLoading || !selectedSlot}
          >
            {patientLoading ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetails;
