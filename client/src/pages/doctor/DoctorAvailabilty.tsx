import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { toast, ToastContainer } from 'react-toastify';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-toastify/dist/ReactToastify.css';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  getAvailability,
  setAvailability,
} from '../../redux/thunks/doctorThunk';

const localizer = momentLocalizer(moment);

const DoctorAvailability: React.FC = () => {
  const dispatch = useAppDispatch();
  const { availability, loading, error } = useAppSelector(
    (state) => state.doctors
  );
  const { user } = useAppSelector((state) => state.auth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<
    { startTime: string; endTime: string }[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user?.role === 'doctor') {
      const startDate = moment().startOf('month').toDate();
      const endDate = moment().endOf('month').toDate();
      dispatch(getAvailability({ startDate, endDate }));
    }
  }, [dispatch, user?.role]);

  const handleSelectSlot = ({ start }: { start: Date }) => {
    const selectedMoment = moment(start);
    const now = moment();

    if (selectedMoment.isBefore(now, 'day')) {
      toast.error('Cannot edit availability for past dates');
      return;
    }

    setSelectedDate(start);

    const existingAvailability = availability.find((avail) =>
      moment(avail.date).isSame(start, 'day')
    );
    const loadedSlots = existingAvailability
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        existingAvailability.timeSlots.map((slot: any) => ({ ...slot })) // Deep copy
      : [];
    setTimeSlots(loadedSlots);
    setIsModalOpen(true);
  };

  const handleAddTimeSlot = () => {
    setTimeSlots([...timeSlots, { startTime: '09:00', endTime: '10:00' }]);
  };

  const handleTimeSlotChange = (
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    const updatedSlots = timeSlots.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    ); // Create new objects
    setTimeSlots(updatedSlots);
  };

  const handleRemoveTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const handleSubmitAvailability = async () => {
    if (!selectedDate || timeSlots.length === 0) {
      toast.error('Please select a date and add at least one time slot');
      return;
    }

    const invalidSlots = timeSlots.some(
      (slot) =>
        !slot.startTime ||
        !slot.endTime ||
        slot.startTime === '' ||
        slot.endTime === ''
    );
    if (invalidSlots) {
      toast.error('All time slots must have a valid start and end time');
      return;
    }

    try {
      await dispatch(
        setAvailability({ date: selectedDate, timeSlots })
      ).unwrap();
      toast.success('Availability updated successfully');
      setIsModalOpen(false);
      const startDate = moment(selectedDate).startOf('month').toDate();
      const endDate = moment(selectedDate).endOf('month').toDate();
      dispatch(getAvailability({ startDate, endDate }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(`Failed to update availability: ${error}`);
    }
  };

  const events = availability.map((avail) => ({
    title: `${avail.timeSlots.length} slot${avail.timeSlots.length > 1 ? 's' : ''} available`,
    start: new Date(avail.date),
    end: new Date(avail.date),
    allDay: true,
  }));

  if (loading && availability.length === 0) {
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
            dispatch(getAvailability({ startDate, endDate }));
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
          Set Your Availability
        </h2>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          onSelectSlot={handleSelectSlot}
          selectable
          className="bg-white/20 rounded-lg"
        />
      </div>

      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">
              Set Availability for {moment(selectedDate).format('MMMM D, YYYY')}
            </h2>
            {timeSlots.length === 0 ? (
              <p className="text-white mb-4">
                No time slots set for this date.
              </p>
            ) : (
              timeSlots.map((slot, index) => (
                <div key={index} className="flex space-x-2 mb-3">
                  <input
                    type="time"
                    className="w-1/2 p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={slot.startTime}
                    onChange={(e) =>
                      handleTimeSlotChange(index, 'startTime', e.target.value)
                    }
                    required
                  />
                  <input
                    type="time"
                    className="w-1/2 p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={slot.endTime}
                    onChange={(e) =>
                      handleTimeSlotChange(index, 'endTime', e.target.value)
                    }
                    required
                  />
                  <button
                    onClick={() => handleRemoveTimeSlot(index)}
                    className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 transition-all duration-300"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
            <button
              onClick={handleAddTimeSlot}
              className="mb-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
            >
              Add Time Slot
            </button>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAvailability}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DoctorAvailability;
