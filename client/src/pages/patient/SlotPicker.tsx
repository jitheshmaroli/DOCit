import React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { styled } from '@mui/material/styles';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';

interface TimeSlot {
  startTime: string;
  endTime: string;
  _id?: string;
}

interface SlotPickerProps {
  timeSlots: TimeSlot[];
  patientLoading: boolean;
  onDateChange: (date: string) => void;
  onSlotSelect: (slot: TimeSlot | null) => void;
  availableDates: string[];
  selectedDate: string;
}

// Styled components
const HighlightedDay = styled(PickersDay)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}80, ${theme.palette.secondary.main}80)`, // Semi-transparent primary/secondary
  borderRadius: '50%',
  width: '36px',
  height: '36px',
  color: theme.palette.primary.contrastText,
  backdropFilter: 'blur(5px)',
  border: `1px solid ${theme.palette.divider}40`, // Subtle divider-based border
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  '&:hover': {
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
  },
  '&:focus': {
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
  },
}));

const CalendarContainer = styled('div')({
  '& .MuiPaper-root': {
    background: 'rgba(17, 24, 39, 0.6)', // Dark semi-transparent background
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
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
  timeSlots,
  patientLoading,
  onDateChange,
  onSlotSelect,
  availableDates,
  selectedDate
}) => {
  const [value, setValue] = React.useState<Dayjs | null>(null);

  // Handle date selection
  const handleDateChange = (newValue: Dayjs | null) => {
    setValue(newValue);
    const formattedDate = newValue ? dayjs(newValue).format('YYYY-MM-DD') : '';
    onDateChange(formattedDate);
    if (!formattedDate) {
      onSlotSelect(null);
    }
  };

  // Custom PickersDay component
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

  // Handle slot selection
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
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 500,
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#ffffff',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                },
                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
                  {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                  },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                  {
                    borderColor: 'rgba(147, 51, 234, 0.8)',
                  },
                '& .MuiSvgIcon-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
            />
          </DemoContainer>
        </CalendarContainer>
      </LocalizationProvider>

      {timeSlots.length > 0 ? (
        <div className="bg-[rgba(17,24,39,0.6)] backdrop-blur-lg p-4 rounded-lg border border-[rgba(255,255,255,0.15)] shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <h3 className="text-lg font-semibold text-white mb-4">
            Available Time Slots
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {timeSlots.map((slot, index) => (
              <button
                key={index}
                onClick={() => handleSlotSelect(slot)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 shadow-[0_4px_8px_rgba(0,0,0,0.2)]"
                disabled={patientLoading}
              >
                {slot.startTime} - {slot.endTime}
              </button>
            ))}
          </div>
        </div>
      ) : (
        selectedDate && (
          <div className="bg-[rgba(17,24,39,0.6)] backdrop-blur-lg p-4 rounded-lg border border-[rgba(255,255,255,0.15)] shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <p className="text-gray-300 text-center">
              No available time slots for the selected date
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default SlotPicker;
