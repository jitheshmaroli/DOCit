import { useState, useEffect } from 'react';
import { DatePicker, PickersDay, PickersDayProps } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Box, Button, Typography, useMediaQuery } from '@mui/material';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

// Define interface for slot data
interface Slot {
  time: string;
  available: boolean;
}

const SlotPicker = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [availableDates, setAvailableDates] = useState<string[]>([
    '2025-04-21',
    '2025-04-22',
    '2025-04-25',
  ]); // Mock available dates
  const [slots, setSlots] = useState<Slot[]>([
    { time: '9:00 AM', available: true },
    { time: '10:00 AM', available: true },
    { time: '11:00 AM', available: false },
  ]); // Mock slots
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    // Simulate API call to fetch available dates
    setAvailableDates(['2025-04-21', '2025-04-22', '2025-04-25']);
  }, []);

  const handleDateChange = (date: Dayjs | null) => {
    setSelectedDate(date);
    // Simulate fetching slots for the selected date
    setSlots([
      { time: '9:00 AM', available: true },
      { time: '10:00 AM', available: true },
      { time: '11:00 AM', available: false },
    ]);
  };

  const renderDay = (props: PickersDayProps) => {
    const { day, ...other } = props;
    const isAvailable = availableDates.includes(day.format('YYYY-MM-DD'));
    return (
      <Box sx={{ position: 'relative' }}>
        <PickersDay {...other} day={day} />
        {isAvailable && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 2,
              left: '50%',
              transform: 'translateX(-50%)',
              width: isMobile ? 6 : 8,
              height: isMobile ? 6 : 8,
              borderRadius: '50%',
              bgcolor: 'success.main',
            }}
            aria-label={`${day.format('MMMM D, YYYY')} has available slots`}
          />
        )}
      </Box>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          padding: 3,
          maxWidth: '800px',
          margin: '0 auto',
          bgcolor: '#f5f5f5',
          borderRadius: 2,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Book an Appointment
        </Typography>
        <Box sx={{ mb: 3 }}>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={handleDateChange}
            slotProps={{
              toolbar: { hidden: isMobile },
              actionBar: { actions: ['clear', 'today'] },
              textField: { fullWidth: true },
            }}
            slots={{ day: renderDay }}
            sx={{ width: { xs: '100%', md: '300px' } }}
            disablePast
            shouldDisableDate={(day: Dayjs) =>
              !availableDates.includes(day.format('YYYY-MM-DD'))
            }
          />
        </Box>
        <Typography variant="subtitle1" gutterBottom>
          Available Slots for {selectedDate?.format('dddd, MMMM D, YYYY') || ''}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 1.5,
          }}
        >
          {slots.map((slot) => (
            <Button
              key={slot.time}
              variant={slot.available ? 'contained' : 'outlined'}
              color={slot.available ? 'primary' : 'secondary'}
              disabled={!slot.available}
              sx={{
                flex: isMobile ? '1 0 100%' : '1 0 120px',
                minWidth: '100px',
                textAlign: 'center',
              }}
              onClick={() =>
                alert(`Booked ${slot.time} on ${selectedDate?.format('MM/DD/YYYY')}`)
              }
            >
              {slot.time}
            </Button>
          ))}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default SlotPicker;