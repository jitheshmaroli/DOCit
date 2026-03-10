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
import dayjs, { Dayjs } from 'dayjs';
import { DateUtils } from '../../utils/DateUtils';
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
import {
  Plus,
  Check,
  X,
  Trash2,
  Edit2,
  Lock,
  AlertTriangle,
  AlertCircle,
  Info,
  RefreshCw,
} from 'lucide-react';

// tiny helpers
const FieldErr = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="error-text mt-1 flex items-center gap-1">
      <AlertCircle size={11} />
      {msg}
    </p>
  ) : null;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// DurationFeedback
const DurationFeedback = ({ slot }: { slot: TimeSlot }) => {
  if (!slot.startTime || !slot.endTime) {
    return (
      <p className="text-xs text-text-muted mt-1">
        Duration: {MIN_SLOT_DURATION_MINUTES}–{MAX_SLOT_DURATION_MINUTES} min
      </p>
    );
  }
  const dur = DateUtils.getTimeDifferenceInMinutes(
    slot.startTime,
    slot.endTime
  );
  const valid = DateUtils.isValidSlotDuration(slot.startTime, slot.endTime);
  return (
    <p
      className={`text-xs mt-1 flex items-center gap-1 ${valid ? 'text-emerald-600' : 'text-error'}`}
    >
      {valid ? <Check size={11} /> : <AlertCircle size={11} />}
      Duration: {dur} min{' '}
      {!valid &&
        `(${MIN_SLOT_DURATION_MINUTES}–${MAX_SLOT_DURATION_MINUTES} min required)`}
    </p>
  );
};

// TimeInput
const TimeInput = ({
  label,
  value,
  onChange,
  disabled,
  error,
  valid,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: string;
  valid?: boolean;
  min?: string;
  max?: string;
}) => (
  <div className="flex-1 min-w-[90px]">
    <label className="label mb-1 text-xs">{label}</label>
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      min={min}
      max={max}
      className={`input py-2 text-sm ${error ? 'input-error' : valid ? 'border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100' : ''} disabled:bg-surface-bg disabled:cursor-not-allowed`}
    />
    <FieldErr msg={error} />
  </div>
);

// Component
const DoctorAvailability: React.FC = () => {
  const dispatch = useAppDispatch();
  const { availability } = useAppSelector((s) => s.doctors);
  const { user } = useAppSelector((s) => s.auth);
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
    [k: number]: { startTime: string; endTime: string };
  }>({});
  const [editingReasons, setEditingReasons] = useState<{ [k: number]: string }>(
    {}
  );
  const [availabilityMap, setAvailabilityMap] = useState<
    Map<string, Availability>
  >(new Map());
  const [conflictErrors, setConflictErrors] = useState<Map<string, string>>(
    new Map()
  );
  const [fieldErrors, setFieldErrors] = useState<{
    [k: number]: {
      startTime?: string;
      endTime?: string;
      reason?: string;
      general?: string;
    };
  }>({});
  const [recurringFieldErrors, setRecurringFieldErrors] = useState<{
    [k: number]: { startTime?: string; endTime?: string };
  }>({});

  const clearSlotErrors = (i: number) =>
    setFieldErrors((p) => ({ ...p, [i]: {} }));
  const clearRecurringSlotErrors = (i: number) =>
    setRecurringFieldErrors((p) => ({ ...p, [i]: {} }));

  const checkTodayValidation = useCallback(
    (index: number) => {
      const slot = recurringTimeSlots[index];
      if (!slot?.startTime) return;
      const today = dayjs();
      const isTodayIncluded =
        recurringDays.includes(today.day()) &&
        recurringStartDate &&
        !recurringStartDate.isAfter(today, 'day') &&
        recurringEndDate &&
        !recurringEndDate.isBefore(today, 'day');
      const cur = recurringFieldErrors[index] || {};
      const ne = { ...cur };
      const msg = 'Cannot set time before current time (today is included)';
      if (isTodayIncluded) {
        const slotTime = dayjs(
          `${today.format('YYYY-MM-DD')} ${slot.startTime}`
        );
        if (slotTime.isBefore(today)) ne.startTime = msg;
        else if (cur.startTime === msg) delete ne.startTime;
      } else {
        if (cur.startTime === msg) delete ne.startTime;
      }
      if (JSON.stringify(ne) !== JSON.stringify(cur))
        setRecurringFieldErrors((p) => ({ ...p, [index]: ne }));
    },
    [
      recurringTimeSlots,
      recurringFieldErrors,
      recurringStartDate,
      recurringEndDate,
      recurringDays,
    ]
  );

  useEffect(() => {
    recurringTimeSlots.forEach((_, i) => checkTodayValidation(i));
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
      availability.forEach((a: Availability) => map.set(a.dateKey, a));
      setAvailabilityMap(map);
    }
  }, [availability]);

  useEffect(() => {
    if (isModalOpen && selectedDate) {
      const key = dayjs(selectedDate).format(DEFAULT_DATE_FORMAT);
      const exist = availabilityMap.get(key);
      if (exist) {
        setSelectedAvailabilityId(exist._id || null);
        setTimeSlots([...exist.timeSlots]);
        setOriginalSlotCount(exist.timeSlots.length);
        setNewSlots([]);
        setFieldErrors({});
      }
    }
  }, [availabilityMap, isModalOpen, selectedDate]);

  const fetchAvailability = useCallback(() => {
    if (user?.role === 'doctor') {
      const start = dateFilter
        ? dateFilter.startOf('month').toDate()
        : dayjs().startOf('month').toDate();
      const end = dateFilter
        ? dateFilter.endOf('month').toDate()
        : dayjs().endOf('month').toDate();
      dispatch(getAvailabilityThunk({ startDate: start, endDate: end }));
    }
  }, [dispatch, user?.role, dateFilter]);

  useEffect(() => {
    if (user?.role === 'doctor') fetchAvailability();
  }, [dispatch, user?.role, dateFilter, fetchAvailability]);

  const generateMonthDates = () => {
    const monthStart = dateFilter
      ? dayjs.utc(dateFilter).startOf('month')
      : dayjs.utc().startOf('month');
    const dates: string[] = [];
    for (let i = 0; i < monthStart.daysInMonth(); i++) {
      const cur = monthStart.add(i, 'day');
      if (DateUtils.isFutureDate(cur.toDate()))
        dates.push(cur.format(DEFAULT_DATE_FORMAT));
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
    const exist = availabilityMap.get(date);
    setSelectedAvailabilityId(exist?._id || null);
    const slots = exist ? exist.timeSlots : [];
    setTimeSlots(slots);
    setOriginalSlotCount(slots.length);
    setNewSlots([]);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleAddTimeSlot = () => {
    const s = { startTime: '', endTime: '' };
    setTimeSlots((p) => [...p, s]);
    setNewSlots((p) => [...p, s]);
    clearSlotErrors(timeSlots.length);
  };

  const handleTimeSlotChange = (
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    clearSlotErrors(index);
    const tr = new RegExp(
      `^${DEFAULT_TIME_FORMAT.replace('HH', '\\d{2}').replace('mm', '\\d{2}')}$`
    );
    if (value !== '' && !tr.test(value)) {
      setFieldErrors((p) => ({
        ...p,
        [index]: {
          ...p[index],
          [field]: `Invalid time format (${DEFAULT_TIME_FORMAT})`,
        },
      }));
      return;
    }
    if (
      selectedDate &&
      dayjs(selectedDate).isSame(dayjs(), 'day') &&
      field === 'startTime'
    ) {
      const slotTime = dayjs(
        `${dayjs(selectedDate).format('YYYY-MM-DD')} ${value}`
      );
      if (slotTime.isBefore(dayjs())) {
        setFieldErrors((p) => ({
          ...p,
          [index]: {
            ...p[index],
            startTime: 'Cannot set time before current time',
          },
        }));
        return;
      }
    }
    const updated = [...timeSlots];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'startTime' && value && !updated[index].endTime)
      updated[index].endTime = DateUtils.addMinutesToTime(
        value,
        MIN_SLOT_DURATION_MINUTES
      );
    setTimeSlots(updated);
    if (
      field === 'startTime' &&
      value &&
      updated[index].endTime &&
      !DateUtils.isValidSlotDuration(value, updated[index].endTime)
    )
      setFieldErrors((p) => ({
        ...p,
        [index]: {
          ...p[index],
          endTime: `Duration must be ${MIN_SLOT_DURATION_MINUTES}-${MAX_SLOT_DURATION_MINUTES} minutes`,
        },
      }));
    if (index >= originalSlotCount) {
      const ni = index - originalSlotCount;
      const un = [...newSlots];
      un[ni] = {
        ...un[ni],
        [field]: value,
        ...(field === 'startTime' && value && !un[ni].endTime
          ? {
              endTime: DateUtils.addMinutesToTime(
                value,
                MIN_SLOT_DURATION_MINUTES
              ),
            }
          : {}),
      };
      setNewSlots(un);
    }
  };

  const handleRecurringTimeSlotChange = (
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    clearRecurringSlotErrors(index);
    const tr = new RegExp(
      `^${DEFAULT_TIME_FORMAT.replace('HH', '\\d{2}').replace('mm', '\\d{2}')}$`
    );
    if (value !== '' && !tr.test(value)) {
      setRecurringFieldErrors((p) => ({
        ...p,
        [index]: {
          ...p[index],
          [field]: `Invalid time format (${DEFAULT_TIME_FORMAT})`,
        },
      }));
      return;
    }
    const updated = [...recurringTimeSlots];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'startTime' && value && !updated[index].endTime)
      updated[index].endTime = DateUtils.addMinutesToTime(
        value,
        MIN_SLOT_DURATION_MINUTES
      );
    setRecurringTimeSlots(updated);
    if (
      field === 'startTime' &&
      value &&
      updated[index].endTime &&
      !DateUtils.isValidSlotDuration(value, updated[index].endTime)
    )
      setRecurringFieldErrors((p) => ({
        ...p,
        [index]: {
          ...p[index],
          endTime: `Duration must be ${MIN_SLOT_DURATION_MINUTES}-${MAX_SLOT_DURATION_MINUTES} minutes`,
        },
      }));
    checkTodayValidation(index);
  };

  const handleRemoveTimeSlot = async (index: number) => {
    if (
      index >= originalSlotCount ||
      !selectedAvailabilityId ||
      timeSlots[index].isBooked
    ) {
      setTimeSlots((p) => p.filter((_, i) => i !== index));
      if (index >= originalSlotCount)
        setNewSlots((p) => p.filter((_, i) => i !== index - originalSlotCount));
      setFieldErrors((p) => {
        const n = { ...p };
        delete n[index];
        return n;
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
      const s = dayjs(selectedDate).startOf('month').toDate(),
        e = dayjs(selectedDate).endOf('month').toDate();
      dispatch(getAvailabilityThunk({ startDate: s, endDate: e }));
      setTimeSlots((p) => p.filter((_, i) => i !== index));
      setOriginalSlotCount((p) => p - 1);
      setFieldErrors((p) => {
        const n = { ...p };
        delete n[index];
        return n;
      });
      if (timeSlots.length === 1) setIsModalOpen(false);
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
      setOriginalTimes((p) => ({
        ...p,
        [index]: { startTime: slot.startTime, endTime: slot.endTime },
      }));
      clearSlotErrors(index);
    }
  };

  const handleConfirmEdit = async () => {
    if (selectedSlotIndex !== null) {
      const slot = timeSlots[selectedSlotIndex];
      if (selectedDate && dayjs(selectedDate).isSame(dayjs(), 'day')) {
        const slotTime = dayjs(
          `${dayjs(selectedDate).format('YYYY-MM-DD')} ${slot.startTime}`
        );
        if (slotTime.isBefore(dayjs())) {
          showError('Cannot update to a time before current time');
          setEditDialogOpen(false);
          setSelectedSlotIndex(null);
          return;
        }
      }
      setEditingIndex(selectedSlotIndex);
      setOriginalTimes((p) => ({
        ...p,
        [selectedSlotIndex]: {
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
      }));
      setEditingReasons((p) => ({ ...p, [selectedSlotIndex]: '' }));
    }
    setEditDialogOpen(false);
    setSelectedSlotIndex(null);
  };

  const handleCancelEdit = (index: number) => {
    const original = originalTimes[index];
    if (original)
      setTimeSlots((p) => {
        const u = [...p];
        u[index] = { ...u[index], ...original };
        return u;
      });
    setEditingIndex(null);
    setEditingReasons((p) => {
      const n = { ...p };
      delete n[index];
      return n;
    });
    setOriginalTimes((p) => {
      const n = { ...p };
      delete n[index];
      return n;
    });
    clearSlotErrors(index);
  };

  const handleSaveSlot = async (index: number) => {
    clearSlotErrors(index);
    const slot = timeSlots[index];
    const errors: any = {};
    if (!slot.startTime) errors.startTime = 'Start time is required';
    if (!slot.endTime) errors.endTime = 'End time is required';
    if (
      slot.startTime &&
      slot.endTime &&
      !DateUtils.isValidSlotDuration(slot.startTime, slot.endTime)
    )
      errors.endTime = `Duration must be ${MIN_SLOT_DURATION_MINUTES}-${MAX_SLOT_DURATION_MINUTES} minutes`;
    if (selectedDate && dayjs(selectedDate).isSame(dayjs(), 'day')) {
      const st = dayjs(
        `${dayjs(selectedDate).format('YYYY-MM-DD')} ${slot.startTime}`
      );
      if (st.isBefore(dayjs()))
        errors.startTime = 'Cannot set time before current time';
    }
    const rsn = editingReasons[index] || '';
    if (slot.isBooked && !rsn.trim())
      errors.reason = 'Reason is required for booked slots';
    if (Object.keys(errors).length > 0) {
      setFieldErrors((p) => ({ ...p, [index]: errors }));
      return;
    }
    const original = originalTimes[index];
    if (
      slot.startTime === original?.startTime &&
      slot.endTime === original?.endTime
    ) {
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
          reason: slot.isBooked ? rsn : undefined,
        })
      ).unwrap();
      showSuccess('Slot updated successfully');
      setEditingIndex(null);
      setEditingReasons((p) => {
        const n = { ...p };
        delete n[index];
        return n;
      });
      setOriginalTimes((p) => {
        const n = { ...p };
        delete n[index];
        return n;
      });
      const s = dayjs(selectedDate).startOf('month').toDate(),
        e = dayjs(selectedDate).endOf('month').toDate();
      dispatch(getAvailabilityThunk({ startDate: s, endDate: e }));
      setFieldErrors((p) => {
        const n = { ...p };
        delete n[index];
        return n;
      });
    } catch (err: any) {
      setFieldErrors((p) => ({
        ...p,
        [index]: {
          ...p[index],
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
        const s = dayjs(selectedDate).startOf('month').toDate(),
          e = dayjs(selectedDate).endOf('month').toDate();
        dispatch(getAvailabilityThunk({ startDate: s, endDate: e }));
        setTimeSlots((p) => p.filter((_, i) => i !== selectedSlotIndex));
        setOriginalSlotCount((p) => p - 1);
      } catch (err: any) {
        showError(err.message || 'Failed to remove slot');
      }
    }
    setEditDialogOpen(false);
    setReason('');
    setSelectedSlotIndex(null);
  };

  const handleReasonChange = (index: number, value: string) => {
    setEditingReasons((p) => ({ ...p, [index]: value }));
    setFieldErrors((p) => ({
      ...p,
      [index]: { ...p[index], reason: undefined },
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

  const validateSlot = (slot: TimeSlot, date: Date) => {
    if (!slot.startTime || !slot.endTime) return false;
    const s = dayjs(`${dayjs(date).format('YYYY-MM-DD')} ${slot.startTime}`);
    const e = dayjs(`${dayjs(date).format('YYYY-MM-DD')} ${slot.endTime}`);
    if (!s.isValid() || !e.isValid() || !s.isBefore(e)) return false;
    if (!DateUtils.isValidSlotDuration(slot.startTime, slot.endTime))
      return false;
    if (dayjs(date).isSame(dayjs(), 'day')) return s.isAfter(dayjs());
    return true;
  };

  const isSubmitDisabled =
    newSlots.length === 0 ||
    newSlots.some((slot, i) => {
      const se = fieldErrors[originalSlotCount + i];
      return (
        !slot.startTime || !slot.endTime || Object.keys(se || {}).length > 0
      );
    });

  const handleSubmitAvailability = async () => {
    setFieldErrors({});
    if (!selectedDate || newSlots.length === 0) {
      showError('Please add at least one new time slot');
      return;
    }
    const validNew = newSlots.filter((s) => validateSlot(s, selectedDate));
    if (validNew.length === 0) {
      newSlots.forEach((slot, i) => {
        const errs: any = {};
        if (!slot.startTime) errs.startTime = 'Start time is required';
        if (!slot.endTime) errs.endTime = 'End time is required';
        if (
          slot.startTime &&
          slot.endTime &&
          !DateUtils.isValidSlotDuration(slot.startTime, slot.endTime)
        )
          errs.endTime = `Duration must be ${MIN_SLOT_DURATION_MINUTES}-${MAX_SLOT_DURATION_MINUTES} minutes`;
        if (Object.keys(errs).length)
          setFieldErrors((p) => ({ ...p, [originalSlotCount + i]: errs }));
      });
      return;
    }
    if (DateUtils.checkOverlappingSlots([...timeSlots], selectedDate)) {
      showError('Time slots cannot overlap');
      return;
    }
    try {
      const response = (await dispatch(
        setAvailabilityThunk({ date: selectedDate, timeSlots: validNew })
      ).unwrap()) as SetAvailabilityResponse;
      showSuccess('New slots added successfully');
      if (response.conflicts.length > 0) {
        const ne = new Map(conflictErrors);
        response.conflicts.forEach((c) =>
          ne.set(dayjs(c.date).format(DEFAULT_DATE_FORMAT), c.error)
        );
        setConflictErrors(ne);
      } else {
        setConflictErrors((p) => {
          const n = new Map(p);
          n.delete(dayjs(selectedDate).format(DEFAULT_DATE_FORMAT));
          return n;
        });
      }
      setNewSlots([]);
      setTimeSlots((p) => p.filter((_, i) => i < originalSlotCount));
      setIsModalOpen(false);
      const s = dayjs(selectedDate).startOf('month').toDate(),
        e = dayjs(selectedDate).endOf('month').toDate();
      await dispatch(getAvailabilityThunk({ startDate: s, endDate: e }));
    } catch (err: any) {
      showError(err.message || 'Failed to add new slots');
    }
  };

  const handleSubmitRecurringAvailability = async () => {
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
    if (recurringEndDate.diff(recurringStartDate, 'day') > MAX_RECURRING_DAYS) {
      showError(`Recurring period cannot exceed ${MAX_RECURRING_DAYS} days`);
      return;
    }
    const invalidSlots: number[] = [];
    recurringTimeSlots.forEach((slot, index) => {
      const errs: any = {};
      if (!slot.startTime) errs.startTime = 'Start time is required';
      if (!slot.endTime) errs.endTime = 'End time is required';
      if (
        slot.startTime &&
        slot.endTime &&
        !DateUtils.isValidSlotDuration(slot.startTime, slot.endTime)
      )
        errs.endTime = `Duration must be ${MIN_SLOT_DURATION_MINUTES}-${MAX_SLOT_DURATION_MINUTES} minutes`;
      if (Object.keys(errs).length > 0) {
        invalidSlots.push(index);
        setRecurringFieldErrors((p) => ({ ...p, [index]: errs }));
      }
    });
    if (invalidSlots.length > 0) {
      showError('Please fix all time slot errors');
      return;
    }
    const today = dayjs();
    const isTodayIncluded =
      recurringDays.includes(today.day()) &&
      !recurringStartDate.isAfter(today, 'day') &&
      !recurringEndDate.isBefore(today, 'day');
    if (isTodayIncluded) {
      recurringTimeSlots.forEach((slot, i) => {
        if (slot.startTime) {
          const st = dayjs(`${today.format('YYYY-MM-DD')} ${slot.startTime}`);
          if (st.isBefore(today)) {
            setRecurringFieldErrors((p) => ({
              ...p,
              [i]: {
                ...p[i],
                startTime:
                  'Cannot set time before current time (today is included)',
              },
            }));
            invalidSlots.push(i);
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
      const response = (await dispatch(
        setAvailabilityThunk({
          date: dayjs.utc(recurringStartDate.format('YYYY-MM-DD')).toDate(),
          timeSlots: recurringTimeSlots,
          isRecurring: true,
          recurringEndDate: dayjs
            .utc(recurringEndDate.format('YYYY-MM-DD'))
            .toDate(),
          recurringDays,
        })
      ).unwrap()) as SetAvailabilityResponse;
      showSuccess('Recurring availability set successfully');
      if (response.conflicts.length > 0) {
        const ne = new Map(conflictErrors);
        response.conflicts.forEach((c) =>
          ne.set(dayjs(c.date).format(DEFAULT_DATE_FORMAT), c.error)
        );
        setConflictErrors(ne);
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

  const isSlotChanged = (index: number) => {
    const orig = originalTimes[index],
      slot = timeSlots[index];
    return (
      orig &&
      (slot.startTime !== orig.startTime || slot.endTime !== orig.endTime)
    );
  };

  const canSaveSlot = (index: number) => {
    const slot = timeSlots[index],
      errs = fieldErrors[index];
    return (
      isSlotChanged(index) &&
      !Object.keys(errs || {}).length &&
      DateUtils.isValidSlotDuration(slot.startTime, slot.endTime) &&
      (!slot.isBooked || (editingReasons[index] || '').trim())
    );
  };

  const filterOptions = [
    { value: 'all', label: 'All Dates' },
    { value: 'created', label: 'With Created Slots' },
    { value: 'booked', label: 'With Booked Slots' },
  ];

  const visibleDates = monthDates
    .filter((d) => {
      if (!dateFilter) return true;
      return dayjs.utc(d).isSame(dayjs.utc(dateFilter), 'month');
    })
    .filter((d) => {
      if (dayjs.utc(d).isSame(dayjs.utc(), 'day')) return true;
      const av = availabilityMap.get(d);
      if (filterType === 'all') return true;
      if (filterType === 'created') return !!av && av.timeSlots.length > 0;
      if (filterType === 'booked')
        return !!av && av.timeSlots.some((s: TimeSlot) => s.isBooked);
      return true;
    });

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Page header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Availability</h1>
            <p className="page-subtitle">
              Set and manage your appointment time slots
            </p>
          </div>
          <button
            onClick={() => setIsRecurringModalOpen(true)}
            className="btn-primary"
          >
            <RefreshCw size={15} /> Set Recurring
          </button>
        </div>

        <div className="card p-6 space-y-5">
          {/* Filters row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <div className="flex-1 max-w-xs">
                <label className="label mb-1.5">Filter by Month</label>
                <DatePicker
                  views={['month']}
                  value={dateFilter}
                  onChange={setDateFilter}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      sx: {
                        '& .MuiInputBase-root': {
                          backgroundColor: '#fff',
                          borderRadius: '12px',
                          fontSize: '14px',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#E2E8F0',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#0EA5E9',
                        },
                        '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#0EA5E9',
                        },
                      },
                    },
                  }}
                />
              </div>
            </LocalizationProvider>
            <div className="flex-1 max-w-xs">
              <label className="label mb-1.5">Filter Dates</label>
              <FilterSelect
                label=""
                value={filterType}
                options={filterOptions}
                onChange={(v) => setFilterType(v as any)}
              />
            </div>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
            {visibleDates.map((date) => {
              const av = availabilityMap.get(date);
              const slotCount = av?.timeSlots.length || 0;
              const error = conflictErrors.get(date);
              const hasBooked = av?.timeSlots.some((s) => s.isBooked);
              return (
                <button
                  key={date}
                  onClick={() => handleSelectDate(date)}
                  className={`relative p-3 rounded-xl border text-left transition-all hover:shadow-card-hover ${
                    error
                      ? 'border-red-200 bg-red-50 hover:bg-red-100'
                      : slotCount > 0
                        ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                        : 'border-surface-border bg-white hover:border-primary-200 hover:bg-primary-50'
                  }`}
                >
                  <div className="text-xs font-semibold text-text-primary">
                    {DateUtils.formatToLocalDisplay(DateUtils.parseToUTC(date))}
                  </div>
                  <div
                    className={`text-xs mt-0.5 ${slotCount > 0 ? 'text-emerald-600' : 'text-text-muted'}`}
                  >
                    {slotCount > 0
                      ? `${slotCount} slot${slotCount > 1 ? 's' : ''}`
                      : 'No slots'}
                  </div>
                  {/* Status dot */}
                  {slotCount > 0 && !error && (
                    <span
                      className={`absolute top-2 right-2 w-2 h-2 rounded-full ${hasBooked ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    />
                  )}
                  {error && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error" />
                  )}
                  {error && (
                    <p
                      className="text-xs text-error mt-1 truncate"
                      title={error}
                    >
                      <AlertTriangle size={10} className="inline mr-0.5" />
                      {error}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main slot modal ── */}
      <Modal
        isOpen={isModalOpen && !!selectedDate}
        onClose={() => {
          setIsModalOpen(false);
          setFieldErrors({});
        }}
        title={`Availability – ${selectedDate ? DateUtils.formatToLocalDisplay(selectedDate) : ''}`}
        size="lg"
        footer={
          <>
            <button
              onClick={() => {
                setIsModalOpen(false);
                setFieldErrors({});
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitAvailability}
              disabled={isSubmitDisabled}
              className={`btn-primary ${isSubmitDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Save New Slots
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {timeSlots.length === 0 && (
            <p className="text-sm text-text-muted py-4 text-center">
              No time slots set for this date.
            </p>
          )}
          {timeSlots.map((slot, index) => {
            const slotErrs = fieldErrors[index] || {};
            const isEditing =
              index >= originalSlotCount || editingIndex === index;
            const dValid =
              slot.startTime &&
              slot.endTime &&
              DateUtils.isValidSlotDuration(slot.startTime, slot.endTime);
            return (
              <div
                key={slot._id || index}
                className="p-4 rounded-xl border border-surface-border bg-surface-bg space-y-3"
              >
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <>
                      <TimeInput
                        label="Start"
                        value={slot.startTime}
                        onChange={(v) =>
                          handleTimeSlotChange(index, 'startTime', v)
                        }
                        error={slotErrs.startTime}
                        valid={!!dValid}
                      />
                      <span className="text-text-muted text-sm mt-5">–</span>
                      <TimeInput
                        label="End"
                        value={slot.endTime}
                        onChange={(v) =>
                          handleTimeSlotChange(index, 'endTime', v)
                        }
                        error={slotErrs.endTime}
                        valid={!!dValid}
                        disabled={!slot.startTime}
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
                      />
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="text-xs text-text-muted">Start</p>
                        <p className="text-sm font-semibold text-text-primary">
                          {slot.startTime}
                        </p>
                      </div>
                      <span className="text-text-muted">–</span>
                      <div className="flex-1">
                        <p className="text-xs text-text-muted">End</p>
                        <p className="text-sm font-semibold text-text-primary">
                          {slot.endTime}
                        </p>
                      </div>
                    </>
                  )}
                  {slot.isBooked && (
                    <span title="Booked">
                      <Lock
                        size={14}
                        className="text-amber-500 flex-shrink-0"
                      />
                    </span>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                    {index < originalSlotCount && editingIndex !== index && (
                      <button
                        onClick={() => handleEditClick(index)}
                        className="p-1.5 rounded-lg text-text-muted hover:bg-primary-50 hover:text-primary-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    {editingIndex === index && (
                      <>
                        <button
                          onClick={() => handleSaveSlot(index)}
                          disabled={!canSaveSlot(index)}
                          title="Save"
                          className={`p-1.5 rounded-lg transition-colors ${canSaveSlot(index) ? 'text-emerald-600 hover:bg-emerald-50' : 'text-text-muted opacity-50 cursor-not-allowed'}`}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => handleCancelEdit(index)}
                          title="Cancel"
                          className="p-1.5 rounded-lg text-text-muted hover:bg-red-50 hover:text-error transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleRemoveClick(index)}
                      title="Remove"
                      className="p-1.5 rounded-lg text-text-muted hover:bg-red-50 hover:text-error transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {isEditing && <DurationFeedback slot={slot} />}
                {slotErrs.general && <FieldErr msg={slotErrs.general} />}

                {/* Reason for booked slot edit */}
                {editingIndex === index && slot.isBooked && (
                  <div>
                    <label className="label mb-1">
                      Reason for Change <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingReasons[index] || ''}
                      onChange={(e) =>
                        handleReasonChange(index, e.target.value)
                      }
                      placeholder="Enter reason for modifying booked slot..."
                      className={`input ${slotErrs.reason ? 'input-error' : ''}`}
                    />
                    <FieldErr msg={slotErrs.reason} />
                  </div>
                )}
              </div>
            );
          })}
          <button
            onClick={handleAddTimeSlot}
            className="btn-ghost text-sm text-primary-600 w-full justify-center py-2.5 border-dashed border border-primary-200 hover:bg-primary-50"
          >
            <Plus size={15} /> Add Time Slot
          </button>
        </div>
      </Modal>

      {/* ── Edit/Remove booked slot modal ── */}
      <Modal
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setReason('');
        }}
        title={
          dialogType === 'update' ? 'Update Booked Slot' : 'Remove Booked Slot'
        }
        size="sm"
        footer={
          <>
            <button
              onClick={() => {
                setEditDialogOpen(false);
                setReason('');
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={
                dialogType === 'update'
                  ? handleConfirmEdit
                  : handleConfirmRemove
              }
              disabled={dialogType === 'remove' && !reason.trim()}
              className={`btn-primary ${dialogType === 'remove' && !reason.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Proceed
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
            <AlertTriangle
              size={15}
              className="text-amber-500 flex-shrink-0 mt-0.5"
            />
            <p className="text-sm text-amber-700">
              This slot is booked. Would you like to proceed with the{' '}
              {dialogType === 'update' ? 'update' : 'removal'}?
              {dialogType === 'remove' &&
                ' Provide a reason (the patient will be notified).'}
            </p>
          </div>
          {dialogType === 'remove' && (
            <div>
              <label className="label mb-1">
                Reason for Removal <span className="text-error">*</span>
              </label>
              <input
                autoFocus
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason..."
                className="input"
              />
            </div>
          )}
        </div>
      </Modal>

      {/* ── Remove non-booked modal ── */}
      <Modal
        isOpen={nonBookedRemoveOpen}
        onClose={() => {
          setNonBookedRemoveOpen(false);
          setRemoveIndex(null);
        }}
        title="Confirm Removal"
        size="sm"
        footer={
          <>
            <button
              onClick={() => {
                setNonBookedRemoveOpen(false);
                setRemoveIndex(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (removeIndex !== null) handleRemoveTimeSlot(removeIndex);
                setNonBookedRemoveOpen(false);
                setRemoveIndex(null);
              }}
              className="btn-danger"
            >
              Remove Slot
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-100 rounded-xl">
          <AlertTriangle
            size={15}
            className="text-error flex-shrink-0 mt-0.5"
          />
          <p className="text-sm text-red-700">
            Are you sure you want to remove this time slot?
          </p>
        </div>
      </Modal>

      {/* ── Recurring availability modal ── */}
      <Modal
        isOpen={isRecurringModalOpen}
        onClose={() => {
          setIsRecurringModalOpen(false);
          setRecurringFieldErrors({});
        }}
        title="Set Recurring Availability"
        size="lg"
        footer={
          <>
            <button
              onClick={() => {
                setIsRecurringModalOpen(false);
                setRecurringFieldErrors({});
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitRecurringAvailability}
              disabled={
                recurringTimeSlots.length === 0 ||
                recurringTimeSlots.some((s, i) => {
                  const e = recurringFieldErrors[i];
                  return (
                    !s.startTime ||
                    !s.endTime ||
                    Object.keys(e || {}).length > 0
                  );
                }) ||
                !recurringStartDate ||
                !recurringEndDate ||
                recurringDays.length === 0
              }
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={15} /> Submit Recurring
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="flex items-center gap-2 p-3 bg-primary-50 border border-primary-100 rounded-xl">
            <Info size={14} className="text-primary-500 flex-shrink-0" />
            <p className="text-xs text-primary-700">
              Select start/end dates, add time slots, then pick which days of
              the week to repeat.
            </p>
          </div>

          {/* Date pickers */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Start Date', 'End Date'].map((label, idx) => (
                <div key={label}>
                  <p className="label mb-1.5">{label}</p>
                  <DatePicker
                    value={idx === 0 ? recurringStartDate : recurringEndDate}
                    onChange={
                      idx === 0 ? setRecurringStartDate : setRecurringEndDate
                    }
                    minDate={
                      idx === 0
                        ? dayjs()
                        : recurringStartDate
                          ? recurringStartDate.add(1, 'day')
                          : dayjs()
                    }
                    maxDate={
                      idx === 1 && recurringStartDate
                        ? recurringStartDate.add(MAX_RECURRING_DAYS, 'day')
                        : undefined
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        sx: {
                          '& .MuiInputBase-root': {
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            fontSize: '14px',
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#E2E8F0',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#0EA5E9',
                          },
                          '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#0EA5E9',
                          },
                        },
                      },
                    }}
                  />
                </div>
              ))}
            </div>
          </LocalizationProvider>

          {/* Day selector */}
          <div>
            <label className="label mb-2">Recurring Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day, i) => (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setRecurringDays((p) =>
                      p.includes(i) ? p.filter((d) => d !== i) : [...p, i]
                    )
                  }
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-colors ${
                    recurringDays.includes(i)
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-text-secondary border-surface-border hover:border-primary-300'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Recurring time slots */}
          <div className="space-y-3">
            {recurringTimeSlots.map((slot, index) => {
              const slotErrs = recurringFieldErrors[index] || {};
              const dValid =
                slot.startTime &&
                slot.endTime &&
                DateUtils.isValidSlotDuration(slot.startTime, slot.endTime);
              return (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-surface-border bg-surface-bg space-y-2"
                >
                  <div className="flex items-end gap-3">
                    <TimeInput
                      label="Start"
                      value={slot.startTime}
                      onChange={(v) =>
                        handleRecurringTimeSlotChange(index, 'startTime', v)
                      }
                      error={slotErrs.startTime}
                      valid={!!dValid}
                    />
                    <span className="text-text-muted text-sm mb-2">–</span>
                    <TimeInput
                      label="End"
                      value={slot.endTime}
                      onChange={(v) =>
                        handleRecurringTimeSlotChange(index, 'endTime', v)
                      }
                      error={slotErrs.endTime}
                      valid={!!dValid}
                      disabled={!slot.startTime}
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
                    />
                    <button
                      onClick={() => {
                        setRecurringTimeSlots((p) =>
                          p.filter((_, i) => i !== index)
                        );
                        setRecurringFieldErrors((p) => {
                          const n = { ...p };
                          delete n[index];
                          return n;
                        });
                      }}
                      className="p-1.5 rounded-lg text-text-muted hover:bg-red-50 hover:text-error transition-colors mb-0.5"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <DurationFeedback slot={slot} />
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              const s = { startTime: '', endTime: '' };
              setRecurringTimeSlots((p) => [...p, s]);
              clearRecurringSlotErrors(recurringTimeSlots.length);
            }}
            className="btn-ghost text-sm text-primary-600 w-full justify-center py-2.5 border-dashed border border-primary-200 hover:bg-primary-50"
          >
            <Plus size={15} /> Add Time Slot
          </button>
        </div>
      </Modal>
    </>
  );
};

export default DoctorAvailability;
