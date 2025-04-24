import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { styled } from '@mui/material/styles';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';

// Demo data: Dates with available slots
const datesWithSlots: Dayjs[] = [
  dayjs('2022-04-17'),
  dayjs('2022-04-20'),
  dayjs('2022-04-25'),
];

// Styled component for highlighted dates
const HighlightedDay = styled(PickersDay)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  borderRadius: '50%',
  width: '36px',
  height: '36px',
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
  },
  '&:focus': {
    backgroundColor: theme.palette.primary.main,
  },
}));

// Custom PickersDay component
const CustomPickersDay = (props: PickersDayProps) => {
  const { day, ...other } = props;

  const hasSlot = datesWithSlots.some((slotDate) => day.isSame(slotDate, 'day'));

  return hasSlot ? (
    <HighlightedDay {...other} day={day} />
  ) : (
    <PickersDay {...other} day={day} />
  );
};

export default function DatePickerValue() {
  const [value, setValue] = React.useState<Dayjs | null>(dayjs('2022-04-17'));

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DemoContainer components={['DatePicker']}>
        <DatePicker
          label="Controlled picker"
          value={value}
          onChange={(newValue: Dayjs | null) => setValue(newValue)}
          slots={{ day: CustomPickersDay }}
        />
      </DemoContainer>
    </LocalizationProvider>
  );
}