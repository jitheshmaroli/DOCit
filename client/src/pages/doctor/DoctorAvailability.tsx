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

  //Inline validation states
  const [fieldErrors, setFieldErrors] = useState<{
    [key: number]: {
      startTime?: string;
      endTime?: string;
      reason?: string;
      general?: string;
    };
  }>({});
  const [recurringFieldErrors, setRecurringFieldErrors] = useState<{
    [key: number]: {
      startTime?: string;
      endTime?: string;
    };
  }>({});

  const isMobile = useMediaQuery('(max-width:600px)');

  // Helper function to clear errors for a specific slot
  const clearSlotErrors = (index: number) => {
    setFieldErrors((prev) => ({
      ...prev,
      [index]: {},
    }));
  };

  const clearRecurringSlotErrors = (index: number) => {
    setRecurringFieldErrors((prev) => ({
      ...prev,
      [index]: {},
    }));
  };

  //Dynamic validation for today inclusion in recurring
  const checkTodayValidation = useCallback(
    (index: number) => {
      const slot = recurringTimeSlots[index];
      if (!slot || !slot.startTime) return;

      const today = dayjs();
      const todayDayOfWeek = today.day();
      const isTodayIncluded =
        recurringDays.includes(todayDayOfWeek) &&
        recurringStartDate &&
        !recurringStartDate.isAfter(today, 'day') &&
        recurringEndDate &&
        !recurringEndDate.isBefore(today, 'day');

      const currentErrors = recurringFieldErrors[index] || {};
      const newError = { ...currentErrors };

      const todayErrorMsg =
        'Cannot set time before current time (today is included)';

      if (isTodayIncluded) {
        const slotTime = dayjs(
          `${today.format('YYYY-MM-DD')} ${slot.startTime}`
        );
        if (slotTime.isBefore(today)) {
          newError.startTime = todayErrorMsg;
        } else {
          // Clear if time is valid
          if (currentErrors.startTime === todayErrorMsg) {
            delete newError.startTime;
          }
        }
      } else {
        // Clear the specific today error if present
        if (currentErrors.startTime === todayErrorMsg) {
          delete newError.startTime;
        }
      }

      // Only update if changed
      if (JSON.stringify(newError) !== JSON.stringify(currentErrors)) {
        setRecurringFieldErrors((prev) => ({
          ...prev,
          [index]: newError,
        }));
      }
    },
    [
      recurringTimeSlots,
      recurringFieldErrors,
      recurringStartDate,
      recurringEndDate,
      recurringDays,
    ]
  );

  // Re-validate all slots when dates or days change
  useEffect(() => {
    console.log('revalidations');
    recurringTimeSlots.forEach((_, index) => {
      checkTodayValidation(index);
    });
  }, [
    recurringStartDate,
    recurringEndDate,
    recurringDays,
    checkTodayValidation,
    recurringTimeSlots.length,
    recurringTimeSlots,
  ]);

  useEffect(() => {
    if (availability.length > 0) {
      const map = new Map<string, Availability>();
      availability.forEach((avail: Availability) => {
        map.set(avail.dateKey, avail);
      });
      setAvailabilityMap(map);
    }
  }, [availability]);

  // Sync timeSlots with latest availability when modal is open
  useEffect(() => {
    if (isModalOpen && selectedDate) {
      const dateKey = dayjs(selectedDate).format(DEFAULT_DATE_FORMAT);
      const existingAvailability = availabilityMap.get(dateKey);
      if (existingAvailability) {
        setSelectedAvailabilityId(existingAvailability._id || null);
        setTimeSlots([...existingAvailability.timeSlots]);
        setOriginalSlotCount(existingAvailability.timeSlots.length);
        setNewSlots([]);
        setFieldErrors({});
      }
    }
  }, [availabilityMap, isModalOpen, selectedDate]);

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
    const existingSlots = existingAvailability
      ? existingAvailability.timeSlots
      : [];
    setTimeSlots(existingSlots);
    setOriginalSlotCount(existingSlots.length);
    setNewSlots([]);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleAddTimeSlot = () => {
    const newSlot = { startTime: '', endTime: '' };
    setTimeSlots([...timeSlots, newSlot]);
    setNewSlots([...newSlots, newSlot]);
    clearSlotErrors(timeSlots.length);
  };

  const handleTimeSlotChange = (
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    
    clearSlotErrors(index);

    const timeRegex = new RegExp(
      `^${DEFAULT_TIME_FORMAT.replace('HH', '\\d{2}').replace('mm', '\\d{2}')}$`
    );
    if (value !== '' && !timeRegex.test(value)) {
      setFieldErrors((prev) => ({
        ...prev,
        [index]: {
          ...prev[index],
          [field]: `Invalid time format (${DEFAULT_TIME_FORMAT})`,
        },
      }));
      return;
    }

    // Current time validation
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
        setFieldErrors((prev) => ({
          ...prev,
          [index]: {
            ...prev[index],
            [field]: 'Cannot set time before current time',
          },
        }));
        return;
      }
    }

    const updatedTimeSlots = [...timeSlots];
    updatedTimeSlots[index] = { ...updatedTimeSlots[index], [field]: value };

    // AUTO-SET END TIME
    if (field === 'startTime' && value && !updatedTimeSlots[index].endTime) {
      const minEndTime = DateUtils.addMinutesToTime(
        value,
        MIN_SLOT_DURATION_MINUTES
      );
      updatedTimeSlots[index].endTime = minEndTime;
    }

    setTimeSlots(updatedTimeSlots);

    // Validate duration when both times are set
    if (field === 'startTime' && value && updatedTimeSlots[index].endTime) {
      if (
        !DateUtils.isValidSlotDuration(value, updatedTimeSlots[index].endTime)
      ) {
        setFieldErrors((prev) => ({
          ...prev,
          [index]: {
            ...prev[index],
            endTime: `Duration must be ${MIN_SLOT_DURATION_MINUTES}-${MAX_SLOT_DURATION_MINUTES} minutes`,
          },
        }));
      }
    }

    // Update newSlots if applicable
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
  };

  const handleRecurringTimeSlotChange = (
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    // Clear previous errors for this slot
    clearRecurringSlotErrors(index);

    const timeRegex = new RegExp(
      `^${DEFAULT_TIME_FORMAT.replace('HH', '\\d{2}').replace('mm', '\\d{2}')}$`
    );
    if (value !== '' && !timeRegex.test(value)) {
      setRecurringFieldErrors((prev) => ({
        ...prev,
        [index]: {
          ...prev[index],
          [field]: `Invalid time format (${DEFAULT_TIME_FORMAT})`,
        },
      }));
      return;
    }

    const updatedTimeSlots = [...recurringTimeSlots];
    updatedTimeSlots[index] = { ...updatedTimeSlots[index], [field]: value };

    // AUTO-SET END TIME
    if (field === 'startTime' && value && !updatedTimeSlots[index].endTime) {
      const minEndTime = DateUtils.addMinutesToTime(
        value,
        MIN_SLOT_DURATION_MINUTES
      );
      updatedTimeSlots[index].endTime = minEndTime;
    }

    setRecurringTimeSlots(updatedTimeSlots);

    // Validate duration
    if (field === 'startTime' && value && updatedTimeSlots[index].endTime) {
      if (
        !DateUtils.isValidSlotDuration(value, updatedTimeSlots[index].endTime)
      ) {
        setRecurringFieldErrors((prev) => ({
          ...prev,
          [index]: {
            ...prev[index],
            endTime: `Duration must be ${MIN_SLOT_DURATION_MINUTES}-${MAX_SLOT_DURATION_MINUTES} minutes`,
          },
        }));
      }
    }

    // Check today validation after time change
    checkTodayValidation(index);
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
      // Clear errors for removed slot
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
      return;
    }

    try {
      await dispatch(
        removeSlotThunk({
          availabilityId: selectedAvailabilityId,
          slotId: timeSlots[index]._id!,
        })
      ).unwrap();
      showSuccess('Slot removed successfully');
      const startDate = dayjs(selectedDate).startOf('month').toDate();
      const endDate = dayjs(selectedDate).endOf('month').toDate();
      dispatch(getAvailabilityThunk({ startDate, endDate }));
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
      setOriginalSlotCount(originalSlotCount - 1);
      // Clear errors for removed slot
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
      if (timeSlots.length === 1) {
        setIsModalOpen(false);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to remove slot');
    }
  };

  const handleEditClick = (index: number) => {
    const slot = timeSlots[index];
    setSelectedSlotIndex(index);
    if (slot.isBooked) {
      setDialogType('update');
      setEditDialogOpen(true);
      clearSlotErrors(index);
    } else {
      setEditingIndex(index);
      setOriginalTimes((prev) => ({
        ...prev,
        [index]: { startTime: slot.startTime, endTime: slot.endTime },
      }));
      clearSlotErrors(index);
    }
  };

  const handleConfirmEdit = async () => {
    if (selectedSlotIndex !== null) {
      const slot = timeSlots[selectedSlotIndex];
      const errors: { startTime?: string; endTime?: string } = {};

      // Validate time
      if (selectedDate && dayjs(selectedDate).isSame(dayjs(), 'day')) {
        const now = dayjs();
        const slotTime = dayjs(
          `${dayjs(selectedDate).format('YYYY-MM-DD')} ${slot.startTime}`
        );
        if (slotTime.isBefore(now)) {
          showError('Cannot update to a time before current time');
          setEditDialogOpen(false);
          setSelectedSlotIndex(null);
          return;
        }
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors((prev) => ({
          ...prev,
          [selectedSlotIndex]: errors,
        }));
        setEditDialogOpen(false);
        setSelectedSlotIndex(null);
        return;
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
      setTimeSlots(updatedTimeSlots);
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
    clearSlotErrors(index);
  };

  const handleSaveSlot = async (index: number) => {
    clearSlotErrors(index);

    const slot = timeSlots[index];
    const errors: { startTime?: string; endTime?: string; reason?: string } =
      {};

    // Validation with inline errors
    if (!slot.startTime) {
      errors.startTime = 'Start time is required';
    }

    if (!slot.endTime) {
      errors.endTime = 'End time is required';
    }

    if (slot.startTime && slot.endTime) {
      if (!DateUtils.isValidSlotDuration(slot.startTime, slot.endTime)) {
        errors.endTime = `Duration must be ${MIN_SLOT_DURATION_MINUTES}-${MAX_SLOT_DURATION_MINUTES} minutes`;
      }
    }

    if (selectedDate && dayjs(selectedDate).isSame(dayjs(), 'day')) {
      const now = dayjs();
      const slotTime = dayjs(
        `${dayjs(selectedDate).format('YYYY-MM-DD')} ${slot.startTime}`
      );
      if (slotTime.isBefore(now)) {
        errors.startTime = 'Cannot set time before current time';
      }
    }

    const reason = editingReasons[index] || '';
    if (slot.isBooked && !reason.trim()) {
      errors.reason = 'Reason is required for booked slots';
    }

    // If there are errors, show them inline and return
    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => ({
        ...prev,
        [index]: errors,
      }));
      return;
    }

    // Proceed with save
    const original = originalTimes[index];
    const changed =
      slot.startTime !== original?.startTime ||
      slot.endTime !== original?.endTime;
    if (!changed) {
      setEditingIndex(null);
      return;
    }

    try {
      await dispatch(
        updateSlotThunk({
          availabilityId: selectedAvailabilityId!,
          slotId: slot._id!,
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
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    } catch (err: any) {
      setFieldErrors((prev) => ({
        ...prev,
        [index]: {
          ...prev[index],
          general: err.message || 'Failed to update slot',
        },
      }));
    }
  };

  const handleConfirmRemove = async () => {
    if (!reason.trim()) {
      showError('Reason is required for removing booked slots');
      return;
    }

    if (selectedSlotIndex !== null && selectedAvailabilityId) {
      try {
        await dispatch(
          removeSlotThunk({
            availabilityId: selectedAvailabilityId,
            slotId: timeSlots[selectedSlotIndex]._id!,
            reason,
          })
        ).unwrap();
        showSuccess('Slot removed successfully');
        const startDate = dayjs(selectedDate).startOf('month').toDate();
        const endDate = dayjs(selectedDate).endOf('month').toDate();
        dispatch(getAvailabilityThunk({ startDate, endDate }));
        setTimeSlots(timeSlots.filter((_, i) => i !== selectedSlotIndex));
        setOriginalSlotCount(originalSlotCount - 1);
      } catch (err: any) {
        showError(err.message || 'Failed to remove slot');
      }
    }
    setEditDialogOpen(false);
    setReason('');
    setSelectedSlotIndex(null);
  };

  const handleReasonChange = (index: number, value: string) => {
    setEditingReasons((prev) => ({
      ...prev,
      [index]: value,
    }));
    // Clear reason error when user starts typing
    setFieldErrors((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        reason: undefined,
      },
    }));
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
    newSlots.some((slot, index) => {
      const slotErrors = fieldErrors[originalSlotCount + index];
      return (
        !slot.startTime ||
        !slot.endTime ||
        Object.keys(slotErrors || {}).length > 0
      );
    });

  const handleSubmitAvailability = async () => {
    // Clear all errors before validation
    setFieldErrors({});

    if (!selectedDate || newSlots.length === 0) {
      showError('Please add at least one new time slot');
      return;
    }

    const validNewSlots = newSlots.filter((slot) =>
      validateSlot(slot, selectedDate)
    );
    if (validNewSlots.length === 0) {
      // Set errors for invalid new slots
      newSlots.forEach((slot, index) => {
        if (!slot.startTime) {
          setFieldErrors((prev) => ({
            ...prev,
            [originalSlotCount + index]: {
              startTime: 'Start time is required',
            },
          }));
        }
        if (!slot.endTime) {
          setFieldErrors((prev) => ({
            ...prev,
            [originalSlotCount + index]: { endTime: 'End time is required' },
          }));
        }
        if (
          slot.startTime &&
          slot.endTime &&
          !DateUtils.isValidSlotDuration(slot.startTime, slot.endTime)
        ) {
          setFieldErrors((prev) => ({
            ...prev,
            [originalSlotCount + index]: {
              endTime: `Duration must be ${MIN_SLOT_DURATION_MINUTES}-${MAX_SLOT_DURATION_MINUTES} minutes`,
            },
          }));
        }
      });
      return;
    }

    if (DateUtils.checkOverlappingSlots([...timeSlots], selectedDate)) {
      showError('Time slots cannot overlap');
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
      setTimeSlots(timeSlots.filter((_, index) => index < originalSlotCount));
      setIsModalOpen(false);
      const startDate = dayjs(selectedDate).startOf('month').toDate();
      const endDate = dayjs(selectedDate).endOf('month').toDate();
      await dispatch(getAvailabilityThunk({ startDate, endDate }));
    } catch (err: any) {
      showError(err.message || 'Failed to add new slots');
    }
  };

  const handleAddRecurringTimeSlot = () => {
    const newSlot = { startTime: '', endTime: '' };
    setRecurringTimeSlots([...recurringTimeSlots, newSlot]);
    clearRecurringSlotErrors(recurringTimeSlots.length);
  };

  const handleRemoveRecurringTimeSlot = (index: number) => {
    setRecurringTimeSlots(recurringTimeSlots.filter((_, i) => i !== index));
    setRecurringFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const handleSubmitRecurringAvailability = async () => {
    // Clear all errors before validation
    setRecurringFieldErrors({});

    if (
      !recurringStartDate ||
      !recurringEndDate ||
      recurringDays.length === 0 ||
      recurringTimeSlots.length === 0
    ) {
      showError(
        'Please provide start date, end date, recurring days, and time slots'
      );
      return;
    }

    if (recurringEndDate.isBefore(recurringStartDate, 'day')) {
      showError('End date must be after start date');
      return;
    }

    const daysDiff = recurringEndDate.diff(recurringStartDate, 'day');
    if (daysDiff > MAX_RECURRING_DAYS) {
      showError(`Recurring period cannot exceed ${MAX_RECURRING_DAYS} days`);
      return;
    }

    // Validate all slots
    const invalidSlots: number[] = [];
    recurringTimeSlots.forEach((slot, index) => {
      const errors: { startTime?: string; endTime?: string } = {};

      if (!slot.startTime) errors.startTime = 'Start time is required';
      if (!slot.endTime) errors.endTime = 'End time is required';

      if (slot.startTime && slot.endTime) {
        if (!DateUtils.isValidSlotDuration(slot.startTime, slot.endTime)) {
          errors.endTime = `Duration must be ${MIN_SLOT_DURATION_MINUTES}-${MAX_SLOT_DURATION_MINUTES} minutes`;
        }
      }

      if (Object.keys(errors).length > 0) {
        invalidSlots.push(index);
        setRecurringFieldErrors((prev) => ({
          ...prev,
          [index]: errors,
        }));
      }
    });

    if (invalidSlots.length > 0) {
      showError('Please fix all time slot errors');
      return;
    }

    // Check for today's past time if today is included in recurring dates
    const today = dayjs();
    const todayDayOfWeek = today.day();
    const isTodayIncluded =
      recurringDays.includes(todayDayOfWeek) &&
      !recurringStartDate.isAfter(today, 'day') &&
      !recurringEndDate.isBefore(today, 'day');

    if (isTodayIncluded) {
      recurringTimeSlots.forEach((slot, index) => {
        if (slot.startTime) {
          const slotTime = dayjs(
            `${today.format('YYYY-MM-DD')} ${slot.startTime}`
          );
          if (slotTime.isBefore(today)) {
            setRecurringFieldErrors((prev) => ({
              ...prev,
              [index]: {
                ...prev[index],
                startTime:
                  'Cannot set time before current time (today is included)',
              },
            }));
            invalidSlots.push(index);
          }
        }
      });
    }

    if (invalidSlots.length > 0) {
      showError(
        'Please fix all time slot errors, including current time validation for today'
      );
      return;
    }

    if (
      DateUtils.checkOverlappingSlots(
        recurringTimeSlots,
        recurringStartDate.toDate()
      )
    ) {
      showError('Time slots cannot overlap');
      return;
    }

    try {
      // Convert local Dayjs to UTC midnight Date
      const utcStartDate = dayjs
        .utc(recurringStartDate!.format('YYYY-MM-DD'))
        .toDate();
      const utcEndDate = dayjs
        .utc(recurringEndDate!.format('YYYY-MM-DD'))
        .toDate();

      const payload = {
        date: utcStartDate,
        timeSlots: recurringTimeSlots,
        isRecurring: true,
        recurringEndDate: utcEndDate,
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
      setRecurringFieldErrors({});
      fetchAvailability();
    } catch (err: any) {
      showError(err.message || 'Failed to set recurring availability');
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

      {/* MAIN MODAL - INLINE VALIDATION */}
      <Modal
        isOpen={isModalOpen && !!selectedDate}
        onClose={() => {
          setIsModalOpen(false);
          setFieldErrors({});
        }}
        title={`Set Availability for ${selectedDate ? DateUtils.formatToLocalDisplay(selectedDate) : ''}`}
        footer={
          <>
            <button
              onClick={() => {
                setIsModalOpen(false);
                setFieldErrors({});
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
        {timeSlots.length === 0 ? (
          <p className="text-white mb-4">No time slots set for this date.</p>
        ) : (
          timeSlots.map((slot, index) => {
            const durationFeedback = getDurationFeedback(slot);
            const slotErrors = fieldErrors[index] || {};

            return (
              <div
                key={slot._id || index}
                className="mb-4 p-3 bg-white/5 rounded-lg"
              >
                <div className="flex flex-col gap-3">
                  {/* TIME INPUTS WITH INLINE ERRORS */}
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
                              className={`w-full p-3 bg-white/10 border-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
                                slotErrors.startTime
                                  ? 'border-red-400'
                                  : durationFeedback.isValid
                                    ? 'border-green-400'
                                    : 'border-white/20'
                              }`}
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
                            {/* INLINE ERROR */}
                            {slotErrors.startTime && (
                              <div className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                <WarningIcon sx={{ fontSize: 14 }} />
                                {slotErrors.startTime}
                              </div>
                            )}
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
                                slotErrors.endTime
                                  ? 'border-red-400'
                                  : durationFeedback.isValid
                                    ? 'border-green-400'
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
                            {/* INLINE ERROR */}
                            {slotErrors.endTime && (
                              <div className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                <WarningIcon sx={{ fontSize: 14 }} />
                                {slotErrors.endTime}
                              </div>
                            )}
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

                  {/* REASON FIELD WITH INLINE ERROR */}
                  {editingIndex === index && slot.isBooked && (
                    <div className="mt-3 pt-2 border-t border-white/10">
                      <TextField
                        label="Reason for Change"
                        value={editingReasons[index] || ''}
                        onChange={(e) =>
                          handleReasonChange(index, e.target.value)
                        }
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="Enter reason for modifying booked slot..."
                        error={!!slotErrors.reason}
                        helperText={slotErrors.reason}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            '& fieldset': {
                              borderColor: slotErrors.reason
                                ? 'rgb(239, 68, 68)'
                                : 'rgba(255, 255, 255, 0.2)',
                            },
                          },
                          '& .MuiFormHelperText-root': {
                            color: 'rgb(239, 68, 68)',
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
                              Object.keys(slotErrors).length > 0 ||
                              !(
                                timeSlots[index].startTime &&
                                timeSlots[index].endTime &&
                                DateUtils.isValidSlotDuration(
                                  timeSlots[index].startTime,
                                  timeSlots[index].endTime
                                )
                              ) ||
                              (timeSlots[index].isBooked &&
                                !(editingReasons[index] || '').trim())
                            }
                            sx={{
                              minWidth: '40px',
                              minHeight: '40px',
                              bgcolor:
                                isSlotChanged(index) &&
                                Object.keys(slotErrors).length === 0 &&
                                DateUtils.isValidSlotDuration(
                                  timeSlots[index].startTime,
                                  timeSlots[index].endTime
                                ) &&
                                (!timeSlots[index].isBooked ||
                                  (editingReasons[index] || '').trim())
                                  ? 'rgba(34, 197, 94, 0.4)'
                                  : 'rgba(255, 255, 255, 0.1)',
                              color:
                                isSlotChanged(index) &&
                                Object.keys(slotErrors).length === 0 &&
                                DateUtils.isValidSlotDuration(
                                  timeSlots[index].startTime,
                                  timeSlots[index].endTime
                                ) &&
                                (!timeSlots[index].isBooked ||
                                  (editingReasons[index] || '').trim())
                                  ? 'white'
                                  : 'rgba(255, 255, 255, 0.5)',
                              '&:hover': {
                                bgcolor:
                                  isSlotChanged(index) &&
                                  Object.keys(slotErrors).length === 0 &&
                                  DateUtils.isValidSlotDuration(
                                    timeSlots[index].startTime,
                                    timeSlots[index].endTime
                                  ) &&
                                  (!timeSlots[index].isBooked ||
                                    (editingReasons[index] || '').trim())
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
          setReason('');
        }}
        title={
          dialogType === 'update' ? 'Update Booked Slot' : 'Remove Booked Slot'
        }
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setEditDialogOpen(false);
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
            onChange={(e) => setReason(e.target.value)}
            sx={{
              '& .MuiInput-root': {
                color: 'white',
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
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

      {/* RECURRING AVAILABILITY MODAL - INLINE VALIDATION */}
      <Modal
        isOpen={isRecurringModalOpen}
        onClose={() => {
          setIsRecurringModalOpen(false);
          setRecurringFieldErrors({});
        }}
        title="Set Recurring Availability"
        footer={
          <>
            <button
              onClick={() => {
                setIsRecurringModalOpen(false);
                setRecurringFieldErrors({});
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
                recurringTimeSlots.some((slot, index) => {
                  const slotErrors = recurringFieldErrors[index];
                  return (
                    !slot.startTime ||
                    !slot.endTime ||
                    Object.keys(slotErrors || {}).length > 0
                  );
                }) ||
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

          {/* TIME SLOTS WITH INLINE ERRORS */}
          {recurringTimeSlots.map((slot, index) => {
            const durationFeedback = getDurationFeedback(slot);
            const slotErrors = recurringFieldErrors[index] || {};

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
                        className={`w-full p-3 bg-white/10 border-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
                          slotErrors.startTime
                            ? 'border-red-400'
                            : durationFeedback.isValid
                              ? 'border-green-400'
                              : 'border-white/20'
                        }`}
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
                      {/* INLINE ERROR */}
                      {slotErrors.startTime && (
                        <div className="text-red-400 text-xs mt-1 flex items-center gap-1">
                          <WarningIcon sx={{ fontSize: 14 }} />
                          {slotErrors.startTime}
                        </div>
                      )}
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
                          slotErrors.endTime
                            ? 'border-red-400'
                            : durationFeedback.isValid
                              ? 'border-green-400'
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
                      {/* INLINE ERROR */}
                      {slotErrors.endTime && (
                        <div className="text-red-400 text-xs mt-1 flex items-center gap-1">
                          <WarningIcon sx={{ fontSize: 14 }} />
                          {slotErrors.endTime}
                        </div>
                      )}
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