/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react';
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
} from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { DateUtils } from '../../utils/DateUtils';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import FilterSelect from '../../components/common/FilterSelect';
import Modal from '../../components/common/Modal';
import {
  MAX_RECURRING_DAYS,
  DEFAULT_TIME_FORMAT,
  DEFAULT_DATE_FORMAT,
  MIN_SLOT_DURATION_MINUTES,
  MAX_SLOT_DURATION_MINUTES,
} from '../../constants/AppConstants';
import {
  Availability,
  SetAvailabilityResponse,
  TimeSlot,
} from '../../types/aailabilityTypes';
import { showError, showSuccess } from '../../utils/toastConfig';

// CONSTANT FOR REASON LENGTH
const MAX_REASON_LENGTH = 100;

// HELPER FUNCTION TO SORT TIME SLOTS BY START TIME
const sortTimeSlotsByStartTime = (slots: TimeSlot[]): TimeSlot[] => {
  return [...slots].sort((a, b) => {
    if (!a.startTime || !b.startTime) return 0;
    return DateUtils.getTimeDifferenceInMinutes('00:00', a.startTime) - 
           DateUtils.getTimeDifferenceInMinutes('00:00', b.startTime);
  });
};

const DoctorAvailability: React.FC = () => {
  const dispatch = useAppDispatch();
  const { availability } = useAppSelector((state) => state.doctors);
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
  const [conflictErrors, setConflictErrors] = useState<Map<string, string>>(
    new Map()
  );
  const [modalError, setModalError] = useState<string>('');
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    if (availability.length > 0) {
      const map = new Map<string, Availability>();
      availability.forEach((avail: Availability) => {
        // SORT SLOTS WHEN LOADING FROM API
        const sortedAvailability = {
          ...avail,
          timeSlots: sortTimeSlotsByStartTime(avail.timeSlots)
        };
        map.set(avail.dateKey, sortedAvailability);
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
      showError('Cannot select past dates');
      return;
    }
    setSelectedDate(selected);
    const existingAvailability = availabilityMap.get(date);
    setSelectedAvailabilityId(existingAvailability?._id || null);
    
    // SORT SLOTS WHEN SELECTING DATE
    const existingSlots = existingAvailability
      ? sortTimeSlotsByStartTime(existingAvailability.timeSlots)
      : [];
    
    setTimeSlots(existingSlots);
    setOriginalSlotCount(existingSlots.length);
    setNewSlots([]);
    setIsModalOpen(true);
    setModalError('');
  };

  const handleAddTimeSlot = () => {
    const newSlot = { startTime: '', endTime: '' };
    const currentSlots = [...timeSlots, newSlot];
    
    // SORT ALL SLOTS AFTER ADDING NEW ONE
    setTimeSlots(sortTimeSlotsByStartTime(currentSlots));
    setNewSlots([...newSlots, newSlot]);
    setModalError('');
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
        setModalError('Cannot set time slots before current time');
        return;
      }
    }

    const updatedTimeSlots = [...timeSlots];
    updatedTimeSlots[index] = { ...updatedTimeSlots[index], [field]: value };

    // AUTO-SET END TIME: If start time is set and end time is empty, set to start + 15 min
    if (field === 'startTime' && value && !updatedTimeSlots[index].endTime) {
      const minEndTime = DateUtils.addMinutesToTime(
        value,
        MIN_SLOT_DURATION_MINUTES
      );
      updatedTimeSlots[index].endTime = minEndTime;
    }

    // RE-SORT AFTER TIME CHANGE
    setTimeSlots(sortTimeSlotsByStartTime(updatedTimeSlots));

    if (index >= originalSlotCount) {
      const newSlotIndex = index - originalSlotCount;
      const updatedNewSlots = [...newSlots];
      updatedNewSlots[newSlotIndex] = {
        ...updatedNewSlots[newSlotIndex],
        [field]: value,
        ...(field === 'startTime' &&
        value &&
        !updatedNewSlots[newSlotIndex].endTime
          ? {
              endTime: DateUtils.addMinutesToTime(
                value,
                MIN_SLOT_DURATION_MINUTES
              ),
            }
          : {}),
      };
      setNewSlots(updatedNewSlots);
    }

    // END TIME VALIDATION - RESET IF INVALID
    if (field === 'startTime' && value && updatedTimeSlots[index].endTime) {
      if (
        !DateUtils.isValidSlotDuration(value, updatedTimeSlots[index].endTime)
      ) {
        const minEndTime = DateUtils.addMinutesToTime(
          value,
          MIN_SLOT_DURATION_MINUTES
        );
        updatedTimeSlots[index].endTime = minEndTime;
        
        // RE-SORT AFTER RESET
        setTimeSlots(sortTimeSlotsByStartTime(updatedTimeSlots));

        if (index >= originalSlotCount) {
          const newSlotIndex = index - originalSlotCount;
          const updatedNewSlots = [...newSlots];
          updatedNewSlots[newSlotIndex].endTime = minEndTime;
          setNewSlots(updatedNewSlots);
        }
      }
    }

    // Clear time-related errors when user types
    if (modalError.includes('time') || modalError.includes('duration')) {
      setModalError('');
    }
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

    // AUTO-SET END TIME: If start time is set and end time is empty, set to start + 15 min
    if (field === 'startTime' && value && !updatedTimeSlots[index].endTime) {
      const minEndTime = DateUtils.addMinutesToTime(
        value,
        MIN_SLOT_DURATION_MINUTES
      );
      updatedTimeSlots[index].endTime = minEndTime;
    }

    // RE-SORT RECURRING SLOTS
    setRecurringTimeSlots(sortTimeSlotsByStartTime(updatedTimeSlots));
  };

  const handleRemoveTimeSlot = async (index: number) => {
    if (
      index >= originalSlotCount ||
      !selectedAvailabilityId ||
      timeSlots[index].isBooked
    ) {
      // Remove from display and re-sort
      const updatedSlots = timeSlots.filter((_, i) => i !== index);
      setTimeSlots(sortTimeSlotsByStartTime(updatedSlots));
      
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
      showSuccess('Slot removed successfully');
      const startDate = dayjs(selectedDate).startOf('month').toDate();
      const endDate = dayjs(selectedDate).endOf('month').toDate();
      dispatch(getAvailabilityThunk({ startDate, endDate }));
      
      // Remove and re-sort
      const updatedSlots = timeSlots.filter((_, i) => i !== index);
      setTimeSlots(sortTimeSlotsByStartTime(updatedSlots));
      setOriginalSlotCount(originalSlotCount - 1);
      
      if (timeSlots.length === 1) {
        setIsModalOpen(false);
      }
    } catch (err: any) {
      console.error(err.message || 'Failed to remove slot');
      setModalError(err.message || 'Failed to remove slot');
    }
  };

  const handleEditClick = (index: number) => {
    const slot = timeSlots[index];
    setSelectedSlotIndex(index);
    if (slot.isBooked) {
      setDialogType('update');
      setEditDialogOpen(true);
      setModalError('');
    } else {
      setEditingIndex(index);
      setOriginalTimes((prev) => ({
        ...prev,
        [index]: { startTime: slot.startTime, endTime: slot.endTime },
      }));
      setModalError('');
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
          setModalError('Cannot update to a time before current time');
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

  const handleCancelEdit = (index: number) => {
    const updatedTimeSlots = [...timeSlots];
    const original = originalTimes[index];
    if (original) {
      updatedTimeSlots[index] = {
        ...updatedTimeSlots[index],
        startTime: original.startTime,
        endTime: original.endTime,
      };
      // RE-SORT AFTER CANCEL
      setTimeSlots(sortTimeSlotsByStartTime(updatedTimeSlots));
    }
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
    setModalError('');
  };

  const handleReasonChange = (index: number, value: string) => {
    if (value.length > MAX_REASON_LENGTH) {
      value = value.slice(0, MAX_REASON_LENGTH);
    }
    
    setEditingReasons((prev) => ({
      ...prev,
      [index]: value,
    }));
    
    if (modalError.includes('Reason')) {
      setModalError('');
    }
  };

  const handleRemoveReasonChange = (value: string) => {
    if (value.length > MAX_REASON_LENGTH) {
      value = value.slice(0, MAX_REASON_LENGTH);
    }
    
    setReason(value);
    
    if (modalError.includes('Reason')) {
      setModalError('');
    }
  };

  const handleSaveSlot = async (index: number) => {
    setModalError('');

    if (!selectedAvailabilityId) {
      setModalError('No availability exists for this date');
      return;
    }

    const slot = timeSlots[index];
    if (!slot.startTime || !slot.endTime) {
      setModalError('Start and end times are required');
      return;
    }

    if (!DateUtils.isValidSlotDuration(slot.startTime, slot.endTime)) {
      setModalError(
        `Slot duration must be between ${MIN_SLOT_DURATION_MINUTES} and ${MAX_SLOT_DURATION_MINUTES} minutes`
      );
      return;
    }

    if (selectedDate && dayjs(selectedDate).isSame(dayjs(), 'day')) {
      const now = dayjs();
      const slotTime = dayjs(
        `${dayjs(selectedDate).format('YYYY-MM-DD')} ${slot.startTime}`
      );
      if (slotTime.isBefore(now)) {
        setModalError('Cannot set time slots before current time');
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
      setModalError('Reason is required for changes to booked slots');
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
      showSuccess('Slot updated successfully');
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
      setConflictErrors((prev) => {
        const newErrors = new Map(prev);
        newErrors.delete(dayjs(selectedDate).format(DEFAULT_DATE_FORMAT));
        return newErrors;
      });
    } catch (err: any) {
      setModalError(err.message || 'Failed to update slot');
    }
  };

  const handleConfirmRemove = async () => {
    setModalError('');

    if (!reason.trim()) {
      setModalError('Reason is required for removing booked slots');
      return;
    }

    if (selectedSlotIndex !== null && selectedAvailabilityId) {
      try {
        await dispatch(
          removeSlotThunk({
            availabilityId: selectedAvailabilityId,
            slotIndex: selectedSlotIndex,
            reason,
          })
        ).unwrap();
        showSuccess('Slot removed successfully');
        const startDate = dayjs(selectedDate).startOf('month').toDate();
        const endDate = dayjs(selectedDate).endOf('month').toDate();
        dispatch(getAvailabilityThunk({ startDate, endDate }));
        const updatedSlots = timeSlots.filter((_, i) => i !== selectedSlotIndex);
        setTimeSlots(sortTimeSlotsByStartTime(updatedSlots));
        setOriginalSlotCount(originalSlotCount - 1);
        setConflictErrors((prev) => {
          const newErrors = new Map(prev);
          newErrors.delete(dayjs(selectedDate).format(DEFAULT_DATE_FORMAT));
          return newErrors;
        });
      } catch (err: any) {
        setModalError(err.message || 'Failed to remove slot');
      }
    }
    setEditDialogOpen(false);
    setReason('');
    setSelectedSlotIndex(null);
  };

  const handleRemoveClick = (index: number) => {
    const slot = timeSlots[index];
    setSelectedSlotIndex(index);
    if (slot.isBooked) {
      setDialogType('remove');
      setEditDialogOpen(true);
      setReason('');
      setModalError('');
    } else {
      setRemoveIndex(index);
      setNonBookedRemoveOpen(true);
    }
  };

  const validateSlot = (slot: TimeSlot, date: Date): boolean => {
    if (!slot.startTime || !slot.endTime) return false;
    const start = dayjs(
      `${dayjs(date).format('YYYY-MM-DD')} ${slot.startTime}`
    );
    const end = dayjs(`${dayjs(date).format('YYYY-MM-DD')} ${slot.endTime}`);
    if (!start.isValid() || !end.isValid() || !start.isBefore(end))
      return false;
    if (!DateUtils.isValidSlotDuration(slot.startTime, slot.endTime))
      return false;
    if (dayjs(date).isSame(dayjs(), 'day')) {
      const now = dayjs();
      return start.isAfter(now);
    }
    return true;
  };

  const isSubmitDisabled =
    newSlots.length === 0 ||
    newSlots.every(
      (slot) =>
        !slot.startTime ||
        !slot.endTime ||
        !DateUtils.isValidSlotDuration(slot.startTime, slot.endTime)
    );

  const handleSubmitAvailability = async () => {
    setModalError('');

    if (!selectedDate || newSlots.length === 0) {
      setModalError('Please add at least one new time slot');
      return;
    }

    // SORT NEW SLOTS BEFORE VALIDATION
    const sortedNewSlots = sortTimeSlotsByStartTime(newSlots);
    const validNewSlots = sortedNewSlots.filter((slot) =>
      validateSlot(slot, selectedDate)
    );
    
    if (validNewSlots.length === 0) {
      setModalError(
        'All new slots must have valid start and end times (15-60 min)'
      );
      return;
    }

    // CHECK OVERLAPPING WITH SORTED SLOTS (combine existing + new)
    const allSlotsForValidation = [...timeSlots, ...validNewSlots];
    if (DateUtils.checkOverlappingSlots(allSlotsForValidation, selectedDate)) {
      setModalError('Time slots cannot overlap');
      return;
    }

    try {
      const payload = {
        date: selectedDate,
        timeSlots: validNewSlots, // Already sorted
      };
      const response = (await dispatch(
        setAvailabilityThunk(payload)
      ).unwrap()) as SetAvailabilityResponse;
      showSuccess('New slots added successfully');
      if (response.conflicts.length > 0) {
        const newErrors = new Map(conflictErrors);
        response.conflicts.forEach((conflict) => {
          newErrors.set(
            dayjs(conflict.date).format(DEFAULT_DATE_FORMAT),
            conflict.error
          );
        });
        setConflictErrors(newErrors);
      } else {
        setConflictErrors((prev) => {
          const newErrors = new Map(prev);
          newErrors.delete(dayjs(selectedDate).format(DEFAULT_DATE_FORMAT));
          return newErrors;
        });
      }
      setNewSlots([]);
      setIsModalOpen(false);
      const startDate = dayjs(selectedDate).startOf('month').toDate();
      const endDate = dayjs(selectedDate).endOf('month').toDate();
      await dispatch(getAvailabilityThunk({ startDate, endDate }));
    } catch (err: any) {
      setModalError(err.message || 'Failed to add new slots');
    }
  };

  const handleAddRecurringTimeSlot = () => {
    const newSlot = { startTime: '', endTime: '' };
    const currentSlots = [...recurringTimeSlots, newSlot];
    
    // SORT RECURRING SLOTS
    setRecurringTimeSlots(sortTimeSlotsByStartTime(currentSlots));
  };

  const handleRemoveRecurringTimeSlot = (index: number) => {
    const updatedSlots = recurringTimeSlots.filter((_, i) => i !== index);
    // SORT AFTER REMOVAL
    setRecurringTimeSlots(sortTimeSlotsByStartTime(updatedSlots));
  };

  const handleSubmitRecurringAvailability = async () => {
    if (
      !recurringStartDate ||
      !recurringEndDate ||
      recurringDays.length === 0 ||
      recurringTimeSlots.length === 0
    ) {
      setModalError(
        'Please provide start date, end date, recurring days, and time slots'
      );
      return;
    }

    if (recurringEndDate.isBefore(recurringStartDate, 'day')) {
      setModalError('End date must be after start date');
      return;
    }

    const daysDiff = recurringEndDate.diff(recurringStartDate, 'day');
    if (daysDiff > MAX_RECURRING_DAYS) {
      setModalError(`Recurring period cannot exceed ${MAX_RECURRING_DAYS} days`);
      return;
    }

    // SORT RECURRING SLOTS BEFORE VALIDATION
    const sortedRecurringSlots = sortTimeSlotsByStartTime(recurringTimeSlots);

    for (const slot of sortedRecurringSlots) {
      if (!slot.startTime || !slot.endTime) {
        setModalError('All slots must have valid start and end times');
        return;
      }
      if (!DateUtils.isValidSlotDuration(slot.startTime, slot.endTime)) {
        setModalError(
          `Slot duration must be ${MIN_SLOT_DURATION_MINUTES}-${MAX_SLOT_DURATION_MINUTES} minutes`
        );
        return;
      }
      const timeRegex = new RegExp(
        `^${DEFAULT_TIME_FORMAT.replace('HH', '\\d{2}').replace('mm', '\\d{2}')}$`
      );
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        setModalError(
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
        setModalError('Invalid slot: Start time must be before end time');
        return;
      }
    }

    if (
      DateUtils.checkOverlappingSlots(
        sortedRecurringSlots,
        recurringStartDate.toDate()
      )
    ) {
      setModalError('Time slots cannot overlap');
      return;
    }

    try {
      const payload = {
        date: recurringStartDate.toDate(),
        timeSlots: sortedRecurringSlots, // Already sorted
        isRecurring: true,
        recurringEndDate: recurringEndDate.toDate(),
        recurringDays,
      };
      const response = (await dispatch(
        setAvailabilityThunk(payload)
      ).unwrap()) as SetAvailabilityResponse;
      showSuccess('Recurring availability set successfully');
      if (response.conflicts.length > 0) {
        const newErrors = new Map(conflictErrors);
        response.conflicts.forEach((conflict) => {
          newErrors.set(
            dayjs(conflict.date).format(DEFAULT_DATE_FORMAT),
            conflict.error
          );
        });
        setConflictErrors(newErrors);
      }
      setIsRecurringModalOpen(false);
      setRecurringTimeSlots([]);
      setRecurringStartDate(null);
      setRecurringEndDate(null);
      setRecurringDays([]);
      fetchAvailability();
    } catch (err: any) {
      setModalError(err.message || 'Failed to set recurring availability');
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

  const getDurationFeedback = (slot: TimeSlot) => {
    if (!slot.startTime || !slot.endTime)
      return { duration: 0, isValid: false };
    const duration = DateUtils.getTimeDifferenceInMinutes(
      slot.startTime,
      slot.endTime
    );
    const isValid = DateUtils.isValidSlotDuration(slot.startTime, slot.endTime);
    return { duration, isValid };
  };

  const DurationFeedback = ({ slot }: { slot: TimeSlot }) => {
    const { duration, isValid } = getDurationFeedback(slot);

    if (!slot.startTime || !slot.endTime) {
      return (
        <div className="text-gray-400 text-xs mt-1">
          Slot duration: {MIN_SLOT_DURATION_MINUTES}-{MAX_SLOT_DURATION_MINUTES}{' '}
          min
        </div>
      );
    }

    return (
      <div
        className={`text-xs mt-1 flex items-center gap-1 ${
          isValid ? 'text-green-400' : 'text-red-400'
        }`}
      >
        <span>Duration: {duration} min</span>
        {isValid ? (
          <CheckIcon fontSize="inherit" sx={{ fontSize: '14px' }} />
        ) : (
          <span>
            ({MIN_SLOT_DURATION_MINUTES}-{MAX_SLOT_DURATION_MINUTES} min
            required)
          </span>
        )}
      </div>
    );
  };

  return (
    <>
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
              const error = conflictErrors.get(date);
              return (
                <Box key={date} sx={{ position: 'relative' }}>
                  <Button
                    variant="outlined"
                    sx={{
                      background: error
                        ? 'rgba(211, 47, 47, 0.2)'
                        : slotCount > 0
                          ? 'linear-gradient(to right, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))'
                          : 'rgba(255, 255, 255, 0.05)',
                      border: error
                        ? '1px solid rgba(211, 47, 47, 0.5)'
                        : '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      textAlign: 'center',
                      padding: '16px',
                      position: 'relative',
                      '&:hover': {
                        background: error
                          ? 'rgba(211, 47, 47, 0.3)'
                          : slotCount > 0
                            ? 'linear-gradient(to right, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.3))'
                            : 'rgba(255, 255, 255, 0.1)',
                      },
                      width: '100%',
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
                      {slotCount > 0 && !error && (
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
                      {error && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: 'error.main',
                          }}
                        />
                      )}
                    </div>
                  </Button>
                  {error && (
                    <Tooltip title={error} arrow>
                      <Box
                        sx={{
                          color: 'error.main',
                          fontSize: '0.75rem',
                          mt: 0.5,
                          textAlign: 'center',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <WarningIcon
                          sx={{
                            fontSize: 16,
                            verticalAlign: 'middle',
                            mr: 0.5,
                          }}
                        />
                        {error}
                      </Box>
                    </Tooltip>
                  )}
                </Box>
              );
            })}
        </Box>
      </div>

      {/* MAIN MODAL */}
      <Modal
        isOpen={isModalOpen && !!selectedDate}
        onClose={() => {
          setIsModalOpen(false);
          setModalError('');
        }}
        title={`Set Availability for ${selectedDate ? DateUtils.formatToLocalDisplay(selectedDate) : ''}`}
        footer={
          <>
            <button
              onClick={() => {
                setIsModalOpen(false);
                setModalError('');
              }}
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
        {/* ERROR DISPLAY */}
        {modalError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-red-300">
              <WarningIcon sx={{ fontSize: 18 }} />
              <span className="text-sm">{modalError}</span>
            </div>
          </div>
        )}

        {timeSlots.length === 0 ? (
          <p className="text-white mb-4">No time slots set for this date.</p>
        ) : (
          // TIME SLOTS ARE ALREADY SORTED BY STATE MANAGEMENT
          timeSlots.map((slot, index) => {
            const durationFeedback = getDurationFeedback(slot);
            return (
              <div key={index} className="mb-4 p-3 bg-white/5 rounded-lg">
                <div className="flex flex-col gap-3">
                  {/* TIME INPUTS */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {index >= originalSlotCount || editingIndex === index ? (
                        <>
                          {/* START TIME */}
                          <div className="flex-1 min-w-[90px] sm:min-w-[110px]">
                            <label className="block text-gray-300 text-xs mb-1">
                              Start Time
                            </label>
                            <input
                              type="time"
                              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                              value={slot.startTime}
                              onChange={(e) =>
                                handleTimeSlotChange(
                                  index,
                                  'startTime',
                                  e.target.value
                                )
                              }
                              placeholder="--:--"
                              required
                            />
                          </div>

                          <span className="text-white text-sm sm:text-base whitespace-nowrap px-2">
                            to
                          </span>

                          {/* END TIME */}
                          <div className="flex-1 min-w-[90px] sm:min-w-[110px]">
                            <label className="block text-gray-300 text-xs mb-1">
                              End Time
                            </label>
                            <input
                              type="time"
                              className={`w-full p-3 bg-white/10 border-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
                                durationFeedback.isValid
                                  ? 'border-green-400'
                                  : slot.startTime
                                    ? 'border-red-400'
                                    : 'border-white/20'
                              }`}
                              value={slot.endTime}
                              min={
                                slot.startTime
                                  ? DateUtils.addMinutesToTime(
                                      slot.startTime,
                                      MIN_SLOT_DURATION_MINUTES
                                    )
                                  : undefined
                              }
                              max={
                                slot.startTime
                                  ? DateUtils.addMinutesToTime(
                                      slot.startTime,
                                      MAX_SLOT_DURATION_MINUTES
                                    )
                                  : undefined
                              }
                              onChange={(e) =>
                                handleTimeSlotChange(
                                  index,
                                  'endTime',
                                  e.target.value
                                )
                              }
                              placeholder="--:--"
                              required
                              disabled={!slot.startTime}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 min-w-[90px] sm:min-w-[110px]">
                            <span className="block text-gray-300 text-xs">
                              Start Time
                            </span>
                            <span className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white text-center text-sm block">
                              {slot.startTime}
                            </span>
                          </div>
                          <span className="text-white text-sm sm:text-base whitespace-nowrap px-2">
                            to
                          </span>
                          <div className="flex-1 min-w-[90px] sm:min-w-[110px]">
                            <span className="block text-gray-300 text-xs">
                              End Time
                            </span>
                            <span className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white text-center text-sm block">
                              {slot.endTime}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* DURATION FEEDBACK */}
                  {(index >= originalSlotCount || editingIndex === index) && (
                    <DurationFeedback slot={slot} />
                  )}

                  {/* REASON FIELD */}
                  {editingIndex === index && slot.isBooked && (
                    <div className="mt-3 pt-2 border-t border-white/10">
                      <TextField
                        label="Reason for Change"
                        value={editingReasons[index] || ''}
                        onChange={(e) => handleReasonChange(index, e.target.value)}
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="Enter reason for modifying booked slot..."
                        error={modalError.includes('Reason')}
                        helperText={
                          modalError.includes('Reason')
                            ? modalError
                            : `${editingReasons[index]?.length || 0}/${MAX_REASON_LENGTH} characters`
                        }
                        inputProps={{
                          maxLength: MAX_REASON_LENGTH,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            '& fieldset': {
                              borderColor: modalError.includes('Reason')
                                ? 'rgb(239, 68, 68)'
                                : 'rgba(255, 255, 255, 0.2)',
                            },
                            '&:hover fieldset': {
                              borderColor: modalError.includes('Reason')
                                ? 'rgb(239, 68, 68)'
                                : 'rgba(168, 85, 247, 0.3)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: modalError.includes('Reason')
                                ? 'rgb(239, 68, 68)'
                                : 'rgba(168, 85, 247, 0.5)',
                              borderWidth: '2px',
                            },
                            color: 'white',
                          },
                          '& .MuiInputLabel-root': {
                            color: modalError.includes('Reason')
                              ? 'rgb(239, 68, 68)'
                              : 'rgba(255, 255, 255, 0.7)',
                            '&.Mui-focused': {
                              color: modalError.includes('Reason')
                                ? 'rgb(239, 68, 68)'
                                : 'white',
                            },
                          },
                          '& .MuiOutlinedInput-input': {
                            color: 'white',
                            '&::placeholder': {
                              color: 'rgba(255, 255, 255, 0.5)',
                            },
                          },
                          '& .MuiFormHelperText-root': {
                            color: modalError.includes('Reason')
                              ? 'rgb(239, 68, 68)'
                              : 'rgba(255, 255, 255, 0.6)',
                            fontSize: '0.75rem',
                          },
                        }}
                      />
                    </div>
                  )}

                  {/* ACTION BUTTONS */}
                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-white/10 relative">
                    {index < originalSlotCount && editingIndex !== index && (
                      <Tooltip title="Edit">
                        <IconButton
                          onClick={() => handleEditClick(index)}
                          size="small"
                          sx={{
                            minWidth: '40px',
                            minHeight: '40px',
                            bgcolor: 'rgba(168, 85, 247, 0.2)',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'rgba(168, 85, 247, 0.4)',
                              transform: 'scale(1.05)',
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {editingIndex === index && (
                      <>
                        <Tooltip title="Save">
                          <IconButton
                            onClick={() => handleSaveSlot(index)}
                            size="small"
                            disabled={
                              !isSlotChanged(index) ||
                              !(
                                timeSlots[index].startTime &&
                                timeSlots[index].endTime &&
                                DateUtils.isValidSlotDuration(
                                  timeSlots[index].startTime,
                                  timeSlots[index].endTime
                                )
                              )
                            }
                            sx={{
                              minWidth: '40px',
                              minHeight: '40px',
                              bgcolor:
                                isSlotChanged(index) &&
                                DateUtils.isValidSlotDuration(
                                  timeSlots[index].startTime,
                                  timeSlots[index].endTime
                                )
                                  ? 'rgba(34, 197, 94, 0.4)'
                                  : 'rgba(255, 255, 255, 0.1)',
                              color:
                                isSlotChanged(index) &&
                                DateUtils.isValidSlotDuration(
                                  timeSlots[index].startTime,
                                  timeSlots[index].endTime
                                )
                                  ? 'white'
                                  : 'rgba(255, 255, 255, 0.5)',
                              '&:hover': {
                                bgcolor:
                                  isSlotChanged(index) &&
                                  DateUtils.isValidSlotDuration(
                                    timeSlots[index].startTime,
                                    timeSlots[index].endTime
                                  )
                                    ? 'rgba(34, 197, 94, 0.8)'
                                    : 'rgba(255, 255, 255, 0.15)',
                                transform: 'scale(1.05)',
                              },
                            }}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <IconButton
                            onClick={() => handleCancelEdit(index)}
                            size="small"
                            sx={{
                              minWidth: '40px',
                              minHeight: '40px',
                              bgcolor: 'rgba(239, 68, 68, 0.4)',
                              color: 'white',
                              '&:hover': {
                                bgcolor: 'rgba(239, 68, 68, 0.8)',
                                transform: 'scale(1.05)',
                              },
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}

                    <Tooltip title="Remove">
                      <IconButton
                        onClick={() => handleRemoveClick(index)}
                        size="small"
                        sx={{
                          minWidth: '40px',
                          minHeight: '40px',
                          bgcolor: 'rgba(239, 68, 68, 0.4)',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(239, 68, 68, 0.8)',
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {slot.isBooked && (
                      <Tooltip title="Booked">
                        <span className="text-yellow-400 text-lg ml-1">🔒</span>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <button
          onClick={handleAddTimeSlot}
          className="mb-4 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg"
        >
          + Add Time Slot
        </button>
      </Modal>

      {/* EDIT/REMOVE BOOKED SLOT MODAL */}
      <Modal
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setModalError('');
          setReason('');
        }}
        title={dialogType === 'update' ? 'Update Booked Slot' : 'Remove Booked Slot'}
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setEditDialogOpen(false);
                setModalError('');
                setReason('');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={
                dialogType === 'update'
                  ? handleConfirmEdit
                  : handleConfirmRemove
              }
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                dialogType === 'remove' && !reason.trim()
                  ? 'bg-gray-600 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
              }`}
              disabled={dialogType === 'remove' && !reason.trim()}
            >
              Proceed
            </button>
          </div>
        }
      >
        {/* ERROR DISPLAY */}
        {modalError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-red-300">
              <WarningIcon sx={{ fontSize: 18 }} />
              <span className="text-sm">{modalError}</span>
            </div>
          </div>
        )}

        <p className="text-white mb-4">
          This slot is booked by a patient. Would you like to proceed with the{' '}
          {dialogType === 'update' ? 'update' : 'removal'}?{' '}
          {dialogType === 'remove' &&
            'Provide a reason for the change (will be notified to the patient).'}
        </p>
        
        {dialogType === 'remove' && (
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Change"
            type="text"
            fullWidth
            variant="standard"
            value={reason}
            onChange={(e) => handleRemoveReasonChange(e.target.value)}
            error={modalError.includes('Reason')}
            helperText={
              modalError.includes('Reason')
                ? modalError
                : `${reason.length}/${MAX_REASON_LENGTH} characters`
            }
            inputProps={{
              maxLength: MAX_REASON_LENGTH,
            }}
            sx={{
              '& .MuiInput-root': {
                color: 'white',
              },
              '& .MuiInputLabel-root': {
                color: modalError.includes('Reason') 
                  ? 'rgb(239, 68, 68)' 
                  : 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiInput-underline:after': {
                borderBottomColor: modalError.includes('Reason') 
                  ? 'rgb(239, 68, 68)' 
                  : 'rgba(168, 85, 247, 0.5)',
              },
              '& .MuiFormHelperText-root': {
                color: modalError.includes('Reason')
                  ? 'rgb(239, 68, 68)'
                  : 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.75rem',
              },
            }}
          />
        )}
      </Modal>

      {/* REMOVE NON-BOOKED SLOT MODAL */}
      <Modal
        isOpen={nonBookedRemoveOpen}
        onClose={() => {
          setNonBookedRemoveOpen(false);
          setRemoveIndex(null);
        }}
        title="Confirm Removal"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setNonBookedRemoveOpen(false);
                setRemoveIndex(null);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (removeIndex !== null) {
                  handleRemoveTimeSlot(removeIndex);
                }
                setNonBookedRemoveOpen(false);
                setRemoveIndex(null);
              }}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
            >
              Proceed
            </button>
          </div>
        }
      >
        <p className="text-white mb-4">
          Are you sure you want to remove this slot?
        </p>
      </Modal>

      {/* RECURRING AVAILABILITY MODAL */}
      <Modal
        isOpen={isRecurringModalOpen}
        onClose={() => {
          setIsRecurringModalOpen(false);
          setModalError('');
        }}
        title="Set Recurring Availability"
        footer={
          <>
            <button
              onClick={() => {
                setIsRecurringModalOpen(false);
                setModalError('');
              }}
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
                  (slot) =>
                    !slot.startTime ||
                    !slot.endTime ||
                    !DateUtils.isValidSlotDuration(slot.startTime, slot.endTime)
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
        {/* ERROR DISPLAY */}
        {modalError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-red-300">
              <WarningIcon sx={{ fontSize: 18 }} />
              <span className="text-sm">{modalError}</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* HEADER */}
          <div className="flex items-center mb-2">
            <label className="block text-gray-200 text-sm">
              Recurring Availability
            </label>
            <Tooltip title="Recurring availability allows you to set the same slots for multiple days. Select the start date, add time slots, choose the end date, and select the days of the week.">
              <InfoIcon sx={{ color: 'white', ml: 1 }} />
            </Tooltip>
          </div>

          {/* DATE PICKERS */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
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
              <div>
                <label className="block text-gray-200 text-sm mb-2">
                  End Date
                </label>
                <DatePicker
                  value={recurringEndDate}
                  onChange={(newValue) => setRecurringEndDate(newValue)}
                  minDate={
                    recurringStartDate
                      ? recurringStartDate.add(1, 'day')
                      : dayjs()
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
            </div>
          </LocalizationProvider>

          {/* RECURRING DAYS */}
          <div>
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

          {/* TIME SLOTS - ALREADY SORTED */}
          {recurringTimeSlots.map((slot, index) => {
            const durationFeedback = getDurationFeedback(slot);
            return (
              <div key={index} className="mb-4 p-3 bg-white/5 rounded-lg">
                <div className="flex flex-col gap-3">
                  {/* TIME INPUTS */}
                  <div className="flex items-center gap-2">
                    {/* START TIME */}
                    <div className="flex-1 min-w-[90px]">
                      <label className="block text-gray-300 text-xs mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
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
                    </div>

                    <span className="text-white text-sm whitespace-nowrap px-2">
                      to
                    </span>

                    {/* END TIME */}
                    <div className="flex-1 min-w-[90px]">
                      <label className="block text-gray-300 text-xs mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        className={`w-full p-3 bg-white/10 border-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
                          durationFeedback.isValid
                            ? 'border-green-400'
                            : slot.startTime
                              ? 'border-red-400'
                              : 'border-white/20'
                        }`}
                        value={slot.endTime}
                        min={
                          slot.startTime
                            ? DateUtils.addMinutesToTime(
                                slot.startTime,
                                MIN_SLOT_DURATION_MINUTES
                              )
                            : undefined
                        }
                        max={
                          slot.startTime
                            ? DateUtils.addMinutesToTime(
                                slot.startTime,
                                MAX_SLOT_DURATION_MINUTES
                              )
                            : undefined
                        }
                        onChange={(e) =>
                          handleRecurringTimeSlotChange(
                            index,
                            'endTime',
                            e.target.value
                          )
                        }
                        placeholder="--:--"
                        required
                        disabled={!slot.startTime}
                      />
                    </div>

                    {/* REMOVE BUTTON */}
                    <Tooltip title="Remove">
                      <IconButton
                        onClick={() => handleRemoveRecurringTimeSlot(index)}
                        size="small"
                        sx={{
                          minWidth: '40px',
                          minHeight: '40px',
                          bgcolor: 'rgba(239, 68, 68, 0.4)',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(239, 68, 68, 0.8)',
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>

                  {/* DURATION FEEDBACK */}
                  <DurationFeedback slot={slot} />
                </div>
              </div>
            );
          })}

          <button
            onClick={handleAddRecurringTimeSlot}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg"
          >
            + Add Time Slot
          </button>
        </div>
      </Modal>
    </>
  );
};

export default DoctorAvailability;