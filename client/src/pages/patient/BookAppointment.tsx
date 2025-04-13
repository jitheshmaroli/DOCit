import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { toast, ToastContainer } from 'react-toastify';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-toastify/dist/ReactToastify.css';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  getDoctorAvailability,
  bookAppointment,
} from '../../redux/thunks/patientThunk';

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  _id?: string;
}

interface Availability {
  _id?: string;
  doctorId: string;
  date: string | Date;
  timeSlots: TimeSlot[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

const localizer = momentLocalizer(moment);

const BookAppointment: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { doctorAvailability, loading, error } = useAppSelector(
    (state) => state.patient
  );
  const { user } = useAppSelector((state) => state.auth);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: Date;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    console.log('User:', user);
    console.log('Doctor ID from params:', doctorId);
    if (user?.role === 'patient' && doctorId) {
      const startDate = moment().startOf('month').toDate();
      const endDate = moment().endOf('month').toDate();
      console.log('Dispatching getDoctorAvailability with:', {
        doctorId,
        startDate,
        endDate,
      });
      dispatch(getDoctorAvailability({ doctorId, startDate, endDate }));
    } else {
      console.log('Conditions not met for fetching:', {
        role: user?.role,
        doctorId,
      });
    }
  }, [dispatch, user, doctorId]);

  useEffect(() => {
    console.log('Updated doctorAvailability:', doctorAvailability);
    console.log('Is array?', Array.isArray(doctorAvailability));
  }, [doctorAvailability]);

  const handleSelectEvent = (event: CalendarEvent) => {
    console.log('Selected event:', event);
    const selectedDate = event.start;
    const availabilityForDate = doctorAvailability.find((avail: Availability) =>
      moment(avail.date).isSame(selectedDate, 'day')
    );
    console.log('Availability for date:', availabilityForDate);

    if (!availabilityForDate || availabilityForDate.timeSlots.length === 0) {
      toast.error('No available slots for this date');
      return;
    }

    setSelectedSlot({ date: selectedDate, startTime: '', endTime: '' });
    setIsModalOpen(true);
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot || !selectedSlot.startTime || !selectedSlot.endTime) {
      toast.error('Please select a time slot');
      return;
    }

    try {
      await dispatch(
        bookAppointment({
          doctorId: doctorId!,
          date: selectedSlot.date,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
        })
      ).unwrap();
      toast.success('Appointment booked successfully');
      setIsModalOpen(false);
      navigate('/patient/profile');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(`Failed to book appointment: ${error}`);
    }
  };

  const events: CalendarEvent[] = Array.isArray(doctorAvailability)
    ? doctorAvailability.map((avail: Availability) => {
        console.log('Mapping availability item:', avail);
        const eventDate = new Date(avail.date);
        return {
          title: `${avail.timeSlots.length} slot${avail.timeSlots.length > 1 ? 's' : ''} available`,
          start: eventDate,
          end: eventDate,
          allDay: true,
        };
      })
    : [];
  console.log('Generated events:', events);

  if (
    loading &&
    (!Array.isArray(doctorAvailability) || doctorAvailability.length === 0)
  ) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-300"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border-l-4 border-red-500 p-4 rounded-lg text-white">
        <p className="text-sm">Error: {error}</p>
        <button
          onClick={() => {
            const startDate = moment().startOf('month').toDate();
            const endDate = moment().endOf('month').toDate();
            dispatch(
              getDoctorAvailability({ doctorId: doctorId!, startDate, endDate })
            );
          }}
          className="mt-2 text-sm text-purple-300 hover:text-purple-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="bg-white/10 backdrop-blur-lg p-4 md:p-6 rounded-2xl border border-white/20 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4">
          Book an Appointment
        </h2>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          onSelectEvent={handleSelectEvent}
          selectable
          className="bg-white/20 rounded-lg"
        />
      </div>

      {isModalOpen && selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">
              Book Appointment for{' '}
              {moment(selectedSlot.date).format('MMMM D, YYYY')}
            </h2>
            <select
              className="w-full p-2 mb-4 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={`${selectedSlot.startTime}-${selectedSlot.endTime}`}
              onChange={(e) => {
                const [startTime, endTime] = e.target.value.split('-');
                setSelectedSlot({ ...selectedSlot, startTime, endTime });
              }}
            >
              <option value="">Select a time slot</option>
              {doctorAvailability
                .find((avail: Availability) =>
                  moment(avail.date).isSame(selectedSlot.date, 'day')
                )
                ?.timeSlots.map((slot: TimeSlot) => (
                  <option
                    key={`${slot.startTime}-${slot.endTime}`}
                    value={`${slot.startTime}-${slot.endTime}`}
                  >
                    {slot.startTime} - {slot.endTime}
                  </option>
                ))}
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleBookAppointment}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
              >
                Book
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookAppointment;
