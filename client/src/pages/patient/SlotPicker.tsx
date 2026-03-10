import React, { useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { styled } from '@mui/material/styles';
import { SlotPickerProps, TimeSlot } from '../../types/authTypes';
import { Clock, Loader2 } from 'lucide-react';

// Highlighted day — available date style
const AvailableDay = styled(PickersDay)(() => ({
  background: 'linear-gradient(135deg, #0EA5E9, #14B8A6)',
  borderRadius: '50%',
  color: '#ffffff',
  fontWeight: 700,
  '&:hover': {
    background: 'linear-gradient(135deg, #0284C7, #0F9693)',
    transform: 'scale(1.08)',
  },
  '&:focus': {
    background: 'linear-gradient(135deg, #0284C7, #0F9693)',
  },
  '&.Mui-selected': {
    background: 'linear-gradient(135deg, #0369A1, #0D7E79)',
    boxShadow: '0 0 0 3px rgba(14,165,233,0.25)',
  },
}));

// Light-mode calendar wrapper
const CalendarWrapper = styled('div')({
  '& .MuiTextField-root': { width: '100%' },
  '& .MuiInputBase-root': {
    background: '#FFFFFF',
    borderRadius: '12px',
    fontSize: '0.9rem',
    color: '#0F172A',
    border: '1.5px solid #E2E8F0',
    transition: 'border-color 0.2s',
    '&:hover': { borderColor: '#0EA5E9' },
    '&.Mui-focused': {
      borderColor: '#0EA5E9',
      boxShadow: '0 0 0 3px rgba(14,165,233,0.15)',
    },
  },
  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
  '& .MuiInputLabel-root': { color: '#64748B', fontWeight: 500 },
  '& .MuiInputLabel-root.Mui-focused': { color: '#0EA5E9' },
  '& .MuiSvgIcon-root': { color: '#64748B' },
  // Popper / paper
  '& .MuiPaper-root': {
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 8px 32px rgba(15,23,42,0.12)',
    color: '#0F172A',
  },
  '& .MuiPickersDay-root': {
    color: '#0F172A',
    borderRadius: '50%',
    fontSize: '0.85rem',
    '&.Mui-disabled': { color: '#CBD5E1', opacity: 0.7 },
    '&:hover': { background: '#F1F5F9' },
  },
  '& .MuiPickersDay-today': {
    border: '2px solid #0EA5E9',
    color: '#0EA5E9',
    fontWeight: 700,
  },
  '& .MuiTypography-root': { color: '#0F172A' },
  '& .MuiPickersCalendarHeader-label': { color: '#0F172A', fontWeight: 600 },
  '& .MuiIconButton-root': {
    color: '#475569',
    '&:hover': { background: '#F1F5F9' },
  },
  '& .MuiDayCalendar-weekDayLabel': {
    color: '#94A3B8',
    fontWeight: 600,
    fontSize: '0.75rem',
  },
  '& .MuiPickersYear-yearButton': {
    color: '#0F172A',
    '&.Mui-selected': { background: '#0EA5E9', color: '#fff' },
  },
});

const SlotPicker: React.FC<SlotPickerProps> = ({
  availableDates,
  selectedDate,
  currentTimeSlots,
  selectedSlot,
  onDateChange,
  onSlotSelect,
  patientLoading,
}) => {
  const [value, setValue] = useState<Dayjs | null>(
    selectedDate ? dayjs(selectedDate) : null
  );

  useEffect(() => {
    setValue(selectedDate ? dayjs(selectedDate) : null);
  }, [selectedDate]);

  const handleDateChange = (newValue: Dayjs | null) => {
    setValue(newValue);
    const formatted = newValue ? dayjs(newValue).format('YYYY-MM-DD') : '';
    onDateChange(formatted);
    if (!formatted) onSlotSelect(null);
  };

  const CustomDay = (props: PickersDayProps) => {
    const { day, ...rest } = props;
    const today = dayjs().startOf('day');
    if (day.isBefore(today, 'day'))
      return <PickersDay {...rest} day={day} disabled />;
    const isAvailable = availableDates.some((d) => day.isSame(dayjs(d), 'day'));
    return isAvailable ? (
      <AvailableDay {...rest} day={day} />
    ) : (
      <PickersDay {...rest} day={day} disabled />
    );
  };

  const isSelected = (slot: TimeSlot) =>
    selectedSlot?.startTime === slot.startTime &&
    selectedSlot?.endTime === slot.endTime;

  return (
    <div className="space-y-5">
      {/* ── Date picker ── */}
      <div>
        <label className="label mb-2">Select Appointment Date</label>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <CalendarWrapper>
            <DatePicker
              value={value}
              onChange={handleDateChange}
              slots={{ day: CustomDay }}
              slotProps={{
                textField: { placeholder: 'Pick a date', size: 'small' },
              }}
            />
          </CalendarWrapper>
        </LocalizationProvider>
        {availableDates.length > 0 && (
          <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary-400 to-teal-400" />
            Highlighted dates have available slots
          </p>
        )}
      </div>

      {/* ── Time slots ── */}
      {selectedDate && (
        <div className="card p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
              <Clock size={14} className="text-primary-500" />
            </div>
            <h3 className="font-semibold text-text-primary text-sm">
              Available Time Slots
            </h3>
          </div>

          {patientLoading ? (
            <div className="flex items-center justify-center gap-2 py-6">
              <Loader2 size={18} className="animate-spin text-primary-400" />
              <span className="text-sm text-text-muted">Loading slots...</span>
            </div>
          ) : currentTimeSlots.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {currentTimeSlots.map((slot, idx) => (
                <button
                  key={idx}
                  onClick={() => onSlotSelect(slot)}
                  disabled={patientLoading}
                  className={`relative py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1 ${
                    isSelected(slot)
                      ? 'bg-primary-500 text-white border-primary-500 shadow-btn-primary'
                      : 'bg-white text-text-primary border-surface-border hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700'
                  }`}
                >
                  {slot.startTime} – {slot.endTime}
                  {isSelected(slot) && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-teal-400 rounded-full border-2 border-white" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Clock size={24} className="text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted">
                No available slots for this date.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SlotPicker;
