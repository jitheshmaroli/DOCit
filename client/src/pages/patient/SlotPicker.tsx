import React, { useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { styled } from '@mui/material/styles';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { SlotPickerProps, TimeSlot } from '../../types/authTypes';

const HighlightedDay = styled(PickersDay)(() => ({
  background:
    'linear-gradient(135deg, rgba(147, 51, 234, 0.8), rgba(59, 130, 246, 0.8))',
  borderRadius: '50%',
  width: '36px',
  height: '36px',
  color: '#ffffff',
  backdropFilter: 'blur(5px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  '&:hover': {
    background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
  },
  '&:focus': {
    background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
  },
}));

const CalendarContainer = styled('div')({
  '& .MuiPaper-root': {
    background:
      'linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(59, 130, 246, 0.1))',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    color: '#ffffff',
  },
  '& .MuiPickersDay-root': {
    color: '#ffffff',
    backgroundColor: 'transparent',
    transition: 'all 0.2s ease',
  },
  '& .MuiPickersDay-root.Mui-disabled': {
    color: 'rgba(255, 255, 255, 0.3)',
    opacity: 0.5,
  },
  '& .MuiTypography-root': {
    color: '#ffffff',
    fontWeight: 500,
  },
  '& .MuiPickersCalendarHeader-label': {
    color: '#ffffff',
    fontSize: '1.1rem',
  },
  '& .MuiIconButton-root': {
    color: '#ffffff',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  '& .MuiPickersArrowSwitcher-root': {
    '& .MuiIconButton-root:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
  },
  '& .MuiDayCalendar-weekDayLabel': {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: 600,
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

  // Synchronize the DatePicker's value with the selectedDate prop
  useEffect(() => {
    setValue(selectedDate ? dayjs(selectedDate) : null);
  }, [selectedDate]);

  const handleDateChange = (newValue: Dayjs | null) => {
    setValue(newValue);
    const formattedDate = newValue ? dayjs(newValue).format('YYYY-MM-DD') : '';
    onDateChange(formattedDate);
    if (!formattedDate) {
      onSlotSelect(null);
    }
  };

  const CustomPickersDay = (props: PickersDayProps) => {
    const { day, ...other } = props;

    const today = dayjs().startOf('day');
    const isPastDate = day.isBefore(today, 'day');
    const isAvailable = availableDates.some((date) =>
      day.isSame(dayjs(date), 'day')
    );

    if (isPastDate) {
      return <PickersDay {...other} day={day} disabled />;
    }

    return isAvailable ? (
      <HighlightedDay {...other} day={day} />
    ) : (
      <PickersDay {...other} day={day} disabled />
    );
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    onSlotSelect(slot);
  };

  return (
    <div className="space-y-4">
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CalendarContainer>
          <DemoContainer components={['DatePicker']}>
            <DatePicker
              label="Select Appointment Date"
              value={value}
              onChange={handleDateChange}
              slots={{ day: CustomPickersDay }}
              sx={{
                '& .MuiInputBase-root': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 500,
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#ffffff',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
                  {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                  },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                  {
                    borderColor: '#9333ea',
                  },
                '& .MuiSvgIcon-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
            />
          </DemoContainer>
        </CalendarContainer>
      </LocalizationProvider>

      {selectedDate && (
        <div className="bg-white/10 backdrop-blur-lg p-4 rounded-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <h3 className="text-lg font-semibold text-white mb-4">
            Available Time Slots
          </h3>
          {patientLoading ? (
            <p className="text-gray-300 text-center">Loading time slots...</p>
          ) : currentTimeSlots.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {currentTimeSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => handleSlotSelect(slot)}
                  disabled={patientLoading}
                  className={`py-2 px-4 rounded-lg border transition-all duration-200 text-sm shadow-[0_4px_8px_rgba(0,0,0,0.2)] ${
                    selectedSlot?.startTime === slot.startTime &&
                    selectedSlot?.endTime === slot.endTime
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white border-white/20 hover:bg-gradient-to-r hover:from-purple-600/30 hover:to-blue-600/30'
                  }`}
                >
                  {slot.startTime} - {slot.endTime}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-300 text-center">
              No available time slots for the selected date
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SlotPicker;
