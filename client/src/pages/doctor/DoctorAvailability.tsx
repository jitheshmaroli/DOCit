/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react';
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
import {
  Box,
  Button,
  useMediaQuery,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { DateUtils } from '../../utils/DateUtils';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import FilterSelect from '../../components/common/FilterSelect';
import Modal from '../../components/common/Modal';
import {
  MAX_RECURRING_DAYS,
  DEFAULT_TIME_FORMAT,
  DEFAULT_DATE_FORMAT,
} from '../../constants/AppConstants';

interface TimeSlot {
  startTime: string;
  endTime: string;
  isBooked?: boolean;
  _id?: string;
}

interface Availability {
  _id?: string;
  date: string;
  dateKey: string;
  timeSlots: TimeSlot[];
  doctorId?: string;
}

interface SetAvailabilityResponse {
  availabilities: Availability[];
  conflicts: { date: string; error: string }[];
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
  const [originalSlotCount, setOriginalSlotCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<Dayjs | null>(dayjs());
  const [filterType, setFilterType] = useState<'all' | 'created' | 'booked'>(
    'all'
  );
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [recurringStartDate, setRecurringStartDate] = useState<Dayjs | null>(
    null
  );
  const [recurringEndDate, setRecurringEndDate] = useState<Dayjs | null>(null);
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [recurringTimeSlots, setRecurringTimeSlots] = useState<TimeSlot[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [nonBookedRemoveOpen, setNonBookedRemoveOpen] = useState(false);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(
    null
  );
  const [reason, setReason] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dialogType, setDialogType] = useState<'update' | 'remove'>('update');
  const [originalTimes, setOriginalTimes] = useState<{
    [key: number]: { startTime: string; endTime: string };
  }>({});
  const [editingReasons, setEditingReasons] = useState<{
    [key: number]: string;
  }>({});
  const [availabilityMap, setAvailabilityMap] = useState<
    Map<string, Availability>
  >(new Map());
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    if (availability.length > 0) {
      const map = new Map<string, Availability>();
      availability.forEach((avail: Availability) => {
        map.set(avail.dateKey, avail);
      });
      setAvailabilityMap(map);
    }
  }, [availability]);

  const fetchAvailability = useCallback(() => {
    if (user?.role === 'doctor') {
      const monthStart = dateFilter
        ? dateFilter.startOf('month').toDate()
        : dayjs().startOf('month').toDate();
      const monthEnd = dateFilter
        ? dateFilter.endOf('month').toDate()
        : dayjs().endOf('month').toDate();
      dispatch(
        getAvailabilityThunk({ startDate: monthStart, endDate: monthEnd })
      );
    }
  }, [dispatch, user?.role, dateFilter]);

  useEffect(() => {
    if (user?.role === 'doctor') {
      fetchAvailability();
    }
  }, [dispatch, user?.role, dateFilter, fetchAvailability]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch({ type: 'doctors/clearError' });
    }
  }, [error, dispatch]);

  const generateMonthDates = () => {
    const monthStart = dateFilter
      ? dayjs.utc(dateFilter).startOf('month')
      : dayjs.utc().startOf('month');
    const daysInMonth = monthStart.daysInMonth();
    const dates: string[] = [];
    for (let i = 0; i < daysInMonth; i++) {
      const current = monthStart.add(i, 'day');
      const currentDate = current.toDate();
      if (DateUtils.isFutureDate(currentDate)) {
        dates.push(current.format(DEFAULT_DATE_FORMAT));
      }
    }
    return dates;
  };

  const monthDates = generateMonthDates();

  const handleSelectDate = (date: string) => {
    const selected = DateUtils.parseToUTC(date);
    if (!DateUtils.isFutureDate(selected)) {
      toast.error('Cannot select past dates');
      return;
    }
    setSelectedDate(selected);
    const existingAvailability = availabilityMap.get(date);
    setSelectedAvailabilityId(existingAvailability?._id || null);
    const existingSlots = existingAvailability
      ? existingAvailability.timeSlots
      : [];
    setTimeSlots(existingSlots);
    setOriginalSlotCount(existingSlots.length);
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
    const timeRegex = new RegExp(
      `^${DEFAULT_TIME_FORMAT.replace('HH', '\\d{2}').replace('mm', '\\d{2}')}$`
    );
    if (value !== '' && !timeRegex.test(value)) return;

    if (
      selectedDate &&
      dayjs(selectedDate).isSame(dayjs(), 'day') &&
      field === 'startTime'
    ) {
      const now = dayjs();
      const slotTime = dayjs(
        `${dayjs(selectedDate).format('YYYY-MM-DD')} ${value}`
      );
      if (slotTime.isBefore(now)) {
        toast.error('Cannot set time slots before current time');
        return;
      }
    }

    const updatedTimeSlots = [...timeSlots];
    updatedTimeSlots[index] = { ...updatedTimeSlots[index], [field]: value };
    setTimeSlots(updatedTimeSlots);

    if (index >= originalSlotCount) {
      const newSlotIndex = index - originalSlotCount;
      const updatedNewSlots = [...newSlots];
      updatedNewSlots[newSlotIndex] = {
        ...updatedNewSlots[newSlotIndex],
        [field]: value,
      };
      setNewSlots(updatedNewSlots);
    }
  };

  const handleRemoveTimeSlot = async (index: number) => {
    if (
      index >= originalSlotCount ||
      !selectedAvailabilityId ||
      timeSlots[index].isBooked
    ) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
      if (index >= originalSlotCount) {
        const newSlotIndex = index - originalSlotCount;
        setNewSlots(newSlots.filter((_, i) => i !== newSlotIndex));
      }
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
      setOriginalSlotCount(originalSlotCount - 1);
      if (timeSlots.length === 1) {
        setIsModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove slot');
    }
  };

  const handleEditClick = (index: number) => {
    const slot = timeSlots[index];
    setSelectedSlotIndex(index);
    if (slot.isBooked) {
      setDialogType('update');
      setEditDialogOpen(true);
    } else {
      setEditingIndex(index);
      setOriginalTimes((prev) => ({
        ...prev,
        [index]: { startTime: slot.startTime, endTime: slot.endTime },
      }));
    }
  };

  const handleConfirmEdit = async () => {
    if (selectedSlotIndex !== null) {
      const slot = timeSlots[selectedSlotIndex];
      if (selectedDate && dayjs(selectedDate).isSame(dayjs(), 'day')) {
        const now = dayjs();
        const slotTime = dayjs(
          `${dayjs(selectedDate).format('YYYY-MM-DD')} ${slot.startTime}`
        );
        if (slotTime.isBefore(now)) {
          toast.error('Cannot update to a time before current time');
          return;
        }
      }
      setEditingIndex(selectedSlotIndex);
      setOriginalTimes((prev) => ({
        ...prev,
        [selectedSlotIndex]: {
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
      }));
      setEditingReasons((prev) => ({ ...prev, [selectedSlotIndex]: '' }));
    }
    setEditDialogOpen(false);
    setSelectedSlotIndex(null);
  };

  const handleSaveSlot = async (index: number) => {
    if (!selectedAvailabilityId) {
      toast.error('No availability exists for this date');
      return;
    }

    const slot = timeSlots[index];
    if (!slot.startTime || !slot.endTime) {
      toast.error('Start and end times are required');
      return;
    }

    if (selectedDate && dayjs(selectedDate).isSame(dayjs(), 'day')) {
      const now = dayjs();
      const slotTime = dayjs(
        `${dayjs(selectedDate).format('YYYY-MM-DD')} ${slot.startTime}`
      );
      if (slotTime.isBefore(now)) {
        toast.error('Cannot set time slots before current time');
        return;
      }
    }

    const original = originalTimes[index];
    const changed =
      slot.startTime !== original?.startTime ||
      slot.endTime !== original?.endTime;
    if (!changed) {
      setEditingIndex(null);
      return;
    }

    const reason = editingReasons[index] || '';
    if (slot.isBooked && !reason.trim()) {
      toast.error('Reason is required for changes to booked slots');
      return;
    }

    try {
      await dispatch(
        updateSlotThunk({
          availabilityId: selectedAvailabilityId,
          slotIndex: index,
          startTime: slot.startTime,
          endTime: slot.endTime,
          reason: slot.isBooked ? reason : undefined,
        })
      ).unwrap();
      toast.success('Slot updated successfully');
      setEditingIndex(null);
      setEditingReasons((prev) => {
        const newReasons = { ...prev };
        delete newReasons[index];
        return newReasons;
      });
      setOriginalTimes((prev) => {
        const newTimes = { ...prev };
        delete newTimes[index];
        return newTimes;
      });
      const startDate = dayjs(selectedDate).startOf('month').toDate();
      const endDate = dayjs(selectedDate).endOf('month').toDate();
      dispatch(getAvailabilityThunk({ startDate, endDate }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to update slot');
    }
  };

  const handleRemoveClick = (index: number) => {
    const slot = timeSlots[index];
    setSelectedSlotIndex(index);
    if (slot.isBooked) {
      setDialogType('remove');
      setEditDialogOpen(true);
      setReason('');
    } else {
      setRemoveIndex(index);
      setNonBookedRemoveOpen(true);
    }
  };

  const handleConfirmRemove = async () => {
    if (selectedSlotIndex !== null && selectedAvailabilityId) {
      try {
        await dispatch(
          removeSlotThunk({
            availabilityId: selectedAvailabilityId,
            slotIndex: selectedSlotIndex,
            reason,
          })
        ).unwrap();
        toast.success('Slot removed successfully');
        const startDate = dayjs(selectedDate).startOf('month').toDate();
        const endDate = dayjs(selectedDate).endOf('month').toDate();
        dispatch(getAvailabilityThunk({ startDate, endDate }));
        setTimeSlots(timeSlots.filter((_, i) => i !== selectedSlotIndex));
        setOriginalSlotCount(originalSlotCount - 1);
      } catch (err: any) {
        toast.error(err.message || 'Failed to remove slot');
      }
    }
    setEditDialogOpen(false);
    setReason('');
    setSelectedSlotIndex(null);
  };

  const validateSlot = (slot: TimeSlot, date: Date): boolean => {
    if (!slot.startTime || !slot.endTime) return false;
    const start = dayjs(
      `${dayjs(date).format('YYYY-MM-DD')} ${slot.startTime}`
    );
    const end = dayjs(`${dayjs(date).format('YYYY-MM-DD')} ${slot.endTime}`);
    if (!start.isValid() || !end.isValid() || !start.isBefore(end))
      return false;
    if (dayjs(date).isSame(dayjs(), 'day')) {
      const now = dayjs();
      return start.isAfter(now);
    }
    return true;
  };

  const isSubmitDisabled =
    newSlots.length === 0 ||
    newSlots.every((slot) => !slot.startTime || !slot.endTime);

  const handleSubmitAvailability = async () => {
    if (!selectedDate || newSlots.length === 0) {
      toast.error('Please add at least one new time slot');
      return;
    }

    const validNewSlots = newSlots.filter((slot) =>
      validateSlot(slot, selectedDate)
    );
    if (validNewSlots.length === 0) {
      toast.error('All new slots must have valid start and end times');
      return;
    }

    if (DateUtils.checkOverlappingSlots([...timeSlots], selectedDate)) {
      toast.error('Time slots cannot overlap');
      return;
    }

    try {
      const payload = {
        date: selectedDate,
        timeSlots: validNewSlots,
      };
      const response = (await dispatch(
        setAvailabilityThunk(payload)
      ).unwrap()) as SetAvailabilityResponse;
      toast.success('New slots added successfully');
      if (response.conflicts.length > 0) {
        response.conflicts.forEach((conflict) => {
          toast.warn(
            `Failed to set availability for ${dayjs(conflict.date).format('YYYY-MM-DD')}: ${conflict.error}`
          );
        });
      }
      setNewSlots([]);
      setTimeSlots(timeSlots.filter((_, index) => index < originalSlotCount));
      setIsModalOpen(false);
      const startDate = dayjs(selectedDate).startOf('month').toDate();
      const endDate = dayjs(selectedDate).endOf('month').toDate();
      await dispatch(getAvailabilityThunk({ startDate, endDate }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to add new slots');
    }
  };

  const handleAddRecurringTimeSlot = () => {
    const newSlot = { startTime: '', endTime: '' };
    setRecurringTimeSlots([...recurringTimeSlots, newSlot]);
  };

  const handleRecurringTimeSlotChange = (
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    const timeRegex = new RegExp(
      `^${DEFAULT_TIME_FORMAT.replace('HH', '\\d{2}').replace('mm', '\\d{2}')}$`
    );
    if (value !== '' && !timeRegex.test(value)) return;

    const updatedTimeSlots = [...recurringTimeSlots];
    updatedTimeSlots[index] = { ...updatedTimeSlots[index], [field]: value };
    setRecurringTimeSlots(updatedTimeSlots);
  };

  const handleRemoveRecurringTimeSlot = (index: number) => {
    setRecurringTimeSlots(recurringTimeSlots.filter((_, i) => i !== index));
  };

  const handleSubmitRecurringAvailability = async () => {
    if (
      !recurringStartDate ||
      !recurringEndDate ||
      recurringDays.length === 0 ||
      recurringTimeSlots.length === 0
    ) {
      toast.error(
        'Please provide start date, end date, recurring days, and time slots'
      );
      return;
    }

    if (recurringEndDate.isBefore(recurringStartDate, 'day')) {
      toast.error('End date must be after start date');
      return;
    }

    const daysDiff = recurringEndDate.diff(recurringStartDate, 'day');
    if (daysDiff > MAX_RECURRING_DAYS) {
      toast.error(`Recurring period cannot exceed ${MAX_RECURRING_DAYS} days`);
      return;
    }

    // Validate all slots
    for (const slot of recurringTimeSlots) {
      if (!slot.startTime || !slot.endTime) {
        toast.error('All slots must have valid start and end times');
        return;
      }
      const timeRegex = new RegExp(
        `^${DEFAULT_TIME_FORMAT.replace('HH', '\\d{2}').replace('mm', '\\d{2}')}$`
      );
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        toast.error(
          `Invalid time format. Use ${DEFAULT_TIME_FORMAT} (e.g., 09:00)`
        );
        return;
      }
      const start = dayjs(
        `${recurringStartDate.format('YYYY-MM-DD')} ${slot.startTime}`
      );
      const end = dayjs(
        `${recurringStartDate.format('YYYY-MM-DD')} ${slot.endTime}`
      );
      if (!start.isValid() || !end.isValid() || !start.isBefore(end)) {
        toast.error('Invalid slot: Start time must be before end time');
        return;
      }
    }

    // Check for overlaps on the start date
    if (
      DateUtils.checkOverlappingSlots(
        recurringTimeSlots,
        recurringStartDate.toDate()
      )
    ) {
      toast.error('Time slots cannot overlap');
      return;
    }

    try {
      const payload = {
        date: recurringStartDate.toDate(),
        timeSlots: recurringTimeSlots,
        isRecurring: true,
        recurringEndDate: recurringEndDate.toDate(),
        recurringDays,
      };
      const response = (await dispatch(
        setAvailabilityThunk(payload)
      ).unwrap()) as SetAvailabilityResponse;
      toast.success('Recurring availability set successfully');
      if (response.conflicts.length > 0) {
        const errors = response.conflicts.map((conflict, index) => (
          <div key={index}>
            {`${index + 1}-Failed to set availability for ${dayjs(conflict.date).format('YYYY-MM-DD')}: ${conflict.error}`}
          </div>
        ));
        toast.warn(<div>{errors}</div>, { autoClose: 5000 });
      }
      setIsRecurringModalOpen(false);
      setRecurringTimeSlots([]);
      setRecurringStartDate(null);
      setRecurringEndDate(null);
      setRecurringDays([]);
      fetchAvailability();
    } catch (err: any) {
      toast.error(err.message || 'Failed to set recurring availability');
    }
  };

  const handleRecurringDayChange = (day: number) => {
    setRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const isSlotChanged = (index: number) => {
    const original = originalTimes[index];
    const slot = timeSlots[index];
    return (
      original &&
      (slot.startTime !== original.startTime ||
        slot.endTime !== original.endTime)
    );
  };

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'created', label: 'With Created Slots' },
    { value: 'booked', label: 'With Booked Slots' },
  ];

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="bg-white/10 backdrop-blur-lg p-4 md:p-6 rounded-2xl border border-white/20 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4">
          Set Your Availability
        </h2>
        <Button
          variant="contained"
          onClick={() => setIsRecurringModalOpen(true)}
          sx={{ mb: 2 }}
        >
          Set Recurring Availability
        </Button>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <div className="mb-4">
            <label className="block text-gray-200 text-sm mb-2">
              Filter by Month
            </label>
            <DatePicker
              views={['month']}
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
        <div className="mb-4">
          <FilterSelect
            label="Filter Dates"
            value={filterType}
            options={filterOptions}
            onChange={(value) =>
              setFilterType(value as 'all' | 'created' | 'booked')
            }
          />
        </div>
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
          {monthDates
            .filter((date) => {
              if (!dateFilter) return true;
              const dateObj = dayjs.utc(date);
              return dateObj.isSame(dayjs.utc(dateFilter), 'month');
            })
            .filter((date) => {
              const isToday = dayjs.utc(date).isSame(dayjs.utc(), 'day');
              if (isToday) return true;
              const avail = availabilityMap.get(date);
              if (filterType === 'all') return true;
              if (filterType === 'created')
                return !!avail && avail.timeSlots.length > 0;
              if (filterType === 'booked')
                return (
                  !!avail && avail.timeSlots.some((s: TimeSlot) => s.isBooked)
                );
              return true;
            })
            .map((date) => {
              const avail = availabilityMap.get(date);
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

      <Modal
        isOpen={isModalOpen && !!selectedDate}
        onClose={() => setIsModalOpen(false)}
        title={`Set Availability for ${selectedDate ? DateUtils.formatToLocalDisplay(selectedDate) : ''}`}
        footer={
          <>
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
          </>
        }
      >
        {timeSlots.length === 0 ? (
          <p className="text-white mb-4">No time slots set for this date.</p>
        ) : (
          timeSlots.map((slot, index) => (
            <div key={index} className="flex flex-col mb-3">
              <div className="flex space-x-2 items-center">
                {index >= originalSlotCount ? (
                  <>
                    <input
                      type="time"
                      className="w-1/3 p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      value={slot.startTime}
                      onChange={(e) =>
                        handleTimeSlotChange(index, 'startTime', e.target.value)
                      }
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
                      placeholder="--:--"
                      required
                    />
                  </>
                ) : editingIndex === index ? (
                  <>
                    <input
                      type="time"
                      className="w-1/3 p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      value={slot.startTime}
                      onChange={(e) =>
                        handleTimeSlotChange(index, 'startTime', e.target.value)
                      }
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
                      placeholder="--:--"
                      required
                    />
                    <button
                      onClick={() => handleSaveSlot(index)}
                      className="bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700 transition-all duration-300"
                      disabled={!isSlotChanged(index)}
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <span className="w-1/3 p-2 bg-white/10 border border-white/20 rounded-lg text-white">
                      {slot.startTime}
                    </span>
                    <span className="w-1/3 p-2 bg-white/10 border border-white/20 rounded-lg text-white">
                      {slot.endTime}
                    </span>
                  </>
                )}
                {index < originalSlotCount && (
                  <IconButton
                    onClick={() => handleEditClick(index)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                )}
                <IconButton
                  onClick={() => handleRemoveClick(index)}
                  sx={{
                    color: '#d32f2f',
                    '&:hover': {
                      backgroundColor: 'rgba(211, 47, 47, 0.1)', // Hover effect similar to bg-red-700
                    },
                  }}
                  aria-label="Remove time slot"
                  title="Remove"
                >
                  <DeleteIcon />
                </IconButton>
                {slot.isBooked && (
                  <span className="text-yellow-400 ml-2">🔒 Booked</span>
                )}
              </div>
              {editingIndex === index && slot.isBooked && (
                <TextField
                  label="Reason for Change"
                  value={editingReasons[index] || ''}
                  onChange={(e) =>
                    setEditingReasons((prev) => ({
                      ...prev,
                      [index]: e.target.value,
                    }))
                  }
                  fullWidth
                  variant="standard"
                  sx={{ mt: 1 }}
                />
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
      </Modal>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>
          {dialogType === 'update'
            ? 'Update Booked Slot'
            : 'Remove Booked Slot'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This slot is booked by a patient. Would you like to proceed with the{' '}
            {dialogType === 'update' ? 'update' : 'removal'}?{' '}
            {dialogType === 'remove' &&
              'Provide a reason for the change (will be notified to the patient).'}
          </DialogContentText>
          {dialogType === 'remove' && (
            <TextField
              autoFocus
              margin="dense"
              label="Reason for Change"
              type="text"
              fullWidth
              variant="standard"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={
              dialogType === 'update' ? handleConfirmEdit : handleConfirmRemove
            }
            disabled={dialogType === 'remove' && !reason.trim()}
          >
            Proceed
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={nonBookedRemoveOpen}
        onClose={() => setNonBookedRemoveOpen(false)}
      >
        <DialogTitle>Confirm Removal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this slot?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNonBookedRemoveOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (removeIndex !== null) {
                handleRemoveTimeSlot(removeIndex);
              }
              setNonBookedRemoveOpen(false);
              setRemoveIndex(null);
            }}
          >
            Proceed
          </Button>
        </DialogActions>
      </Dialog>

      <Modal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        title="Set Recurring Availability"
        footer={
          <>
            <button
              onClick={() => setIsRecurringModalOpen(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitRecurringAvailability}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
              disabled={
                recurringTimeSlots.length === 0 ||
                recurringTimeSlots.some(
                  (slot) => !slot.startTime || !slot.endTime
                ) ||
                !recurringStartDate ||
                !recurringEndDate ||
                recurringDays.length === 0
              }
            >
              Submit Recurring
            </button>
          </>
        }
      >
        <div className="flex items-center mb-2">
          <label className="block text-gray-200 text-sm">
            Recurring Availability
          </label>
          <Tooltip title="Recurring availability allows you to set the same slots for multiple days. Select the start date, add time slots, choose the end date, and select the days of the week (e.g., Mondays, Tuesdays) to apply the slots to.">
            <InfoIcon sx={{ color: 'white', ml: 1 }} />
          </Tooltip>
        </div>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <div className="mb-4">
            <label className="block text-gray-200 text-sm mb-2">
              Start Date
            </label>
            <DatePicker
              value={recurringStartDate}
              onChange={(newValue) => setRecurringStartDate(newValue)}
              minDate={dayjs()}
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
          <div className="mb-4">
            <label className="block text-gray-200 text-sm mb-2">End Date</label>
            <DatePicker
              value={recurringEndDate}
              onChange={(newValue) => setRecurringEndDate(newValue)}
              minDate={
                recurringStartDate ? recurringStartDate.add(1, 'day') : dayjs()
              }
              maxDate={
                recurringStartDate
                  ? recurringStartDate.add(MAX_RECURRING_DAYS, 'day')
                  : undefined
              }
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
        {recurringTimeSlots.map((slot, index) => (
          <div key={index} className="flex space-x-2 mb-3 items-center">
            <input
              type="time"
              className="w-1/3 p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={slot.startTime}
              onChange={(e) =>
                handleRecurringTimeSlotChange(
                  index,
                  'startTime',
                  e.target.value
                )
              }
              placeholder="--:--"
              required
            />
            <input
              type="time"
              className="w-1/3 p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={slot.endTime}
              onChange={(e) =>
                handleRecurringTimeSlotChange(index, 'endTime', e.target.value)
              }
              placeholder="--:--"
              required
            />
            <button
              onClick={() => handleRemoveRecurringTimeSlot(index)}
              className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 transition-all duration-300"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={handleAddRecurringTimeSlot}
          className="mb-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
        >
          Add Time Slot
        </button>
      </Modal>
    </>
  );
};

export default DoctorAvailability;
