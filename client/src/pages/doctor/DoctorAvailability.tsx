/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  getAvailabilityThunk,
  setAvailabilityThunk,
  removeSlotThunk,
  updateSlotThunk,
} from '../../redux/thunks/doctorThunk';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Box, Button, useMediaQuery, FormControlLabel, Checkbox } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { DateUtils } from '../../utils/DateUtils';

interface TimeSlot {
  startTime: string;
  endTime: string;
  booked?: boolean;
  _id?: string;
}

interface Availability {
  _id?: string;
  date: string;
  timeSlots: TimeSlot[];
  doctorId?: string;
}

const DoctorAvailability: React.FC = () => {
  const dispatch = useAppDispatch();
  const { availability, error } = useAppSelector((state) => state.doctors);
  const { user } = useAppSelector((state) => state.auth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState<
    string | null
  >(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [newSlots, setNewSlots] = useState<TimeSlot[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<Dayjs | null>(dayjs());
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringEndDate, setRecurringEndDate] = useState<Dayjs | null>(null);
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    if (user?.role === 'doctor') {
      const startDate = dayjs().startOf('month').toDate();
      const endDate = dayjs().endOf('month').toDate();
      dispatch(getAvailabilityThunk({ startDate, endDate }));
    }
  }, [dispatch, user?.role]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch({ type: 'doctors/clearError' });
    }
  }, [error, dispatch]);

  const futureDates = Array.from(
    { length: 30 },
    (_, i) =>
      DateUtils.formatToISO(dayjs().add(i, 'day').toDate()).split('T')[0]
  );

  const handleSelectDate = (date: string) => {
    const selected = DateUtils.parseToUTC(date);
    if (!DateUtils.isFutureDate(selected)) {
      toast.error('Cannot set availability for past dates');
      return;
    }

    setSelectedDate(selected);
    setRecurringDays([dayjs(selected).day()]); // Set the selected day as the default recurring day
    const existingAvailability = availability.find((avail: Availability) =>
      dayjs(avail.date).isSame(date, 'day')
    );
    setSelectedAvailabilityId(existingAvailability?._id || null);
    setTimeSlots(
      existingAvailability ? [...existingAvailability.timeSlots] : []
    );
    setNewSlots([]);
    setIsModalOpen(true);
  };

  const handleAddTimeSlot = () => {
    const newSlot = { startTime: '', endTime: '' };
    setTimeSlots([...timeSlots, newSlot]);
    setNewSlots([...newSlots, newSlot]);
  };

  const handleTimeSlotChange = (
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    if (value !== '' && !value.match(/^\d{2}:\d{2}$/)) return;

    const updatedTimeSlots = [...timeSlots];
    updatedTimeSlots[index] = { ...updatedTimeSlots[index], [field]: value };
    setTimeSlots(updatedTimeSlots);

    if (index >= timeSlots.length - newSlots.length) {
      const newSlotIndex = index - (timeSlots.length - newSlots.length);
      const updatedNewSlots = [...newSlots];
      updatedNewSlots[newSlotIndex] = {
        ...updatedNewSlots[newSlotIndex],
        [field]: value,
      };
      setNewSlots(updatedNewSlots);
    }
  };

  const handleRemoveTimeSlot = async (index: number) => {
    if (!selectedAvailabilityId || timeSlots[index].booked) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
      setNewSlots(newSlots.filter((_, i) => i !== index));
      return;
    }

    try {
      await dispatch(
        removeSlotThunk({
          availabilityId: selectedAvailabilityId,
          slotIndex: index,
        })
      ).unwrap();
      toast.success('Slot removed successfully');
      const startDate = dayjs(selectedDate).startOf('month').toDate();
      const endDate = dayjs(selectedDate).endOf('month').toDate();
      dispatch(getAvailabilityThunk({ startDate, endDate }));
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
      setNewSlots(newSlots.filter((_, i) => i !== index));
      if (timeSlots.length === 1) {
        setIsModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove slot');
    }
  };

  const handleUpdateTimeSlot = async (index: number) => {
    if (!selectedAvailabilityId) {
      toast.error('No availability exists for this date');
      return;
    }

    const slot = timeSlots[index];
    if (!slot.startTime || !slot.endTime) {
      toast.error('Start and end times are required');
      return;
    }

    if (slot.booked) {
      toast.error('Cannot update a booked slot');
      return;
    }

    try {
      await dispatch(
        updateSlotThunk({
          availabilityId: selectedAvailabilityId,
          slotIndex: index,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })
      ).unwrap();
      toast.success('Slot updated successfully');
      const startDate = dayjs(selectedDate).startOf('month').toDate();
      const endDate = dayjs(selectedDate).endOf('month').toDate();
      dispatch(getAvailabilityThunk({ startDate, endDate }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to update slot');
    }
  };

  const validateSlot = (slot: TimeSlot): boolean => {
    if (!slot.startTime || !slot.endTime) return true;
    const start = dayjs.utc(
      `${dayjs.utc(selectedDate!).format('YYYY-MM-DD')} ${slot.startTime}`
    );
    const end = dayjs.utc(
      `${dayjs.utc(selectedDate!).format('YYYY-MM-DD')} ${slot.endTime}`
    );
    return start.isValid() && end.isValid() && start.isBefore(end);
  };

  const isSubmitDisabled =
    newSlots.length === 0 ||
    newSlots.some((slot) => !slot.startTime || !slot.endTime) ||
    (isRecurring && (!recurringEndDate || recurringDays.length === 0));

  const handleSubmitAvailability = async () => {
    if (!selectedDate || newSlots.length === 0) {
      toast.error('Please add at least one new time slot');
      return;
    }

    for (const slot of newSlots) {
      if (!slot.startTime || !slot.endTime) {
        toast.error('All slots must have start and end times');
        return;
      }
      if (!validateSlot(slot)) {
        toast.error('Invalid slot: Start time must be before end time');
        return;
      }
    }

    if (DateUtils.checkOverlappingSlots([...timeSlots], selectedDate)) {
      toast.error('Time slots cannot overlap');
      return;
    }

    try {
      const payload: any = {
        date: selectedDate,
        timeSlots: newSlots,
      };

      if (isRecurring && recurringEndDate && recurringDays.length > 0) {
        payload.isRecurring = true;
        payload.recurringEndDate = recurringEndDate.toDate();
        payload.recurringDays = recurringDays;
      }

      await dispatch(setAvailabilityThunk(payload)).unwrap();
      toast.success('New slots added successfully');
      setIsModalOpen(false);
      setNewSlots([]);
      setTimeSlots([]);
      setIsRecurring(false);
      setRecurringEndDate(null);
      setRecurringDays([]);
      const startDate = dayjs(selectedDate).startOf('month').toDate();
      const endDate = dayjs(selectedDate).endOf('month').toDate();
      dispatch(getAvailabilityThunk({ startDate, endDate }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to add new slots');
    }
  };

  const handleRecurringDayChange = (day: number) => {
    setRecurringDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white/10 backdrop-blur-lg p-4 md:p-6 rounded-2xl border border-white/20 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">
              Set Your Availability
            </h2>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <div className="mb-4">
                <label className="block text-gray-200 text-sm mb-2">
                  Filter by Month
                </label>
                <DatePicker
                  views={['year', 'month']}
                  value={dateFilter}
                  onChange={(newValue) => setDateFilter(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: {
                        '& .MuiInputBase-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          color: 'white',
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                        },
                        '& .Mui-focused': {
                          borderColor: 'rgba(192, 132, 252, 0.4)',
                        },
                      },
                    },
                  }}
                  sx={{ width: isMobile ? '100%' : '300px' }}
                />
              </div>
            </LocalizationProvider>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? '1fr'
                  : 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 2,
                mt: 4,
              }}
            >
              {futureDates
                .filter((date) =>
                  dateFilter ? dayjs(date).isSame(dateFilter, 'month') : true
                )
                .map((date) => {
                  const avail = availability.find((a: Availability) =>
                    dayjs(a.date).isSame(date, 'day')
                  );
                  const slotCount = avail?.timeSlots.length || 0;
                  return (
                    <Button
                      key={date}
                      variant="outlined"
                      sx={{
                        background:
                          slotCount > 0
                            ? 'linear-gradient(to right, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))'
                            : 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: 'white',
                        textAlign: 'center',
                        padding: '16px',
                        position: 'relative',
                        '&:hover': {
                          background:
                            slotCount > 0
                              ? 'linear-gradient(to right, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.3))'
                              : 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                      onClick={() => handleSelectDate(date)}
                      disabled={
                        !DateUtils.isFutureDate(DateUtils.parseToUTC(date))
                      }
                    >
                      <div>
                        <div>
                          {DateUtils.formatToLocalDisplay(
                            DateUtils.parseToUTC(date)
                          )}
                        </div>
                        <div className="text-sm">
                          {slotCount > 0
                            ? `${slotCount} slot${slotCount > 1 ? 's' : ''}`
                            : 'No slots'}
                        </div>
                        {slotCount > 0 && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              bgcolor: 'success.main',
                            }}
                          />
                        )}
                      </div>
                    </Button>
                  );
                })}
            </Box>
          </div>
        </div>
      </div>

      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">
              Set Availability for{' '}
              {DateUtils.formatToLocalDisplay(selectedDate)}
            </h2>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  sx={{ color: 'white', '&.Mui-checked': { color: 'purple' } }}
                />
              }
              label="Make this slot recurring"
              sx={{ color: 'white', mb: 2 }}
            />
            {isRecurring && (
              <>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <div className="mb-4">
                    <label className="block text-gray-200 text-sm mb-2">
                      Recurring Until
                    </label>
                    <DatePicker
                      value={recurringEndDate}
                      onChange={(newValue) => setRecurringEndDate(newValue)}
                      minDate={dayjs(selectedDate).add(1, 'day')}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          sx: {
                            '& .MuiInputBase-root': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: '8px',
                              color: 'white',
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(255, 255, 255, 0.7)',
                            },
                            '& .Mui-focused': {
                              borderColor: 'rgba(192, 132, 252, 0.4)',
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </LocalizationProvider>
                <div className="mb-4">
                  <label className="block text-gray-200 text-sm mb-2">
                    Recurring Days
                  </label>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                      (day, index) => (
                        <FormControlLabel
                          key={day}
                          control={
                            <Checkbox
                              checked={recurringDays.includes(index)}
                              onChange={() => handleRecurringDayChange(index)}
                              sx={{
                                color: 'white',
                                '&.Mui-checked': { color: 'purple' },
                              }}
                            />
                          }
                          label={day}
                          sx={{ color: 'white' }}
                        />
                      )
                    )}
                  </Box>
                </div>
              </>
            )}
            {timeSlots.length === 0 ? (
              <p className="text-white mb-4">
                No time slots set for this date.
              </p>
            ) : (
              timeSlots.map((slot, index) => (
                <div key={index} className="flex space-x-2 mb-3 items-center">
                  <input
                    type="time"
                    className="w-1/3 p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={slot.startTime}
                    onChange={(e) =>
                      handleTimeSlotChange(index, 'startTime', e.target.value)
                    }
                    disabled={slot.booked}
                    placeholder="--:--"
                    required
                  />
                  <input
                    type="time"
                    className="w-1/3 p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={slot.endTime}
                    onChange={(e) =>
                      handleTimeSlotChange(index, 'endTime', e.target.value)
                    }
                    disabled={slot.booked}
                    placeholder="--:--"
                    required
                  />
                  <button
                    onClick={() => handleUpdateTimeSlot(index)}
                    className="bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 transition-all duration-300"
                    disabled={!selectedAvailabilityId || slot.booked}
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleRemoveTimeSlot(index)}
                    className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 transition-all duration-300"
                    disabled={slot.booked}
                  >
                    Remove
                  </button>
                  {slot.booked && (
                    <span className="text-yellow-400 ml-2">🔒 Booked</span>
                  )}
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
                disabled={isSubmitDisabled}
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