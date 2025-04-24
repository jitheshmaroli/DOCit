import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  bookAppointmentThunk,
  getDoctorAvailabilityThunk,
  getDoctorAvailabilityForDateThunk,
  getPatientSubscriptionThunk,
  checkFreeBookingThunk,
  getPatientAppointmentsForDoctorThunk,
} from '../thunks/patientThunk';

interface TimeSlot {
  startTime: string;
  endTime: string;
  _id?: string;
}

interface Availability {
  _id?: string;
  doctorId: string;
  date: string | Date;
  timeSlots: TimeSlot[];
}

interface Subscription {
  _id: string;
  plan: {
    _id: string;
    name: string;
    description?: string;
    appointmentCost: number;
    duration: number;
  };
  daysUntilExpiration: number;
  isExpired: boolean;
}

interface Appointment {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  isFreeBooking: boolean;
}

interface PatientState {
  doctorAvailability: Availability[];
  activeSubscriptions: { [doctorId: string]: Subscription | null };
  timeSlots: TimeSlot[];
  appointments: Appointment[];
  hasFreeBooking: boolean;
  loading: boolean;
  error: string | null;
}



const initialState: PatientState = {
  doctorAvailability: [],
  activeSubscriptions: {},
  timeSlots: [],
  appointments: [],
  hasFreeBooking: false,
  loading: false,
  error: null,
};

const patientSlice = createSlice({
  name: 'patient',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDoctorAvailabilityThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDoctorAvailabilityThunk.fulfilled, (state, action: PayloadAction<Availability[]>) => {
        state.loading = false;
        state.doctorAvailability = action.payload;
      })
      .addCase(getDoctorAvailabilityThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getDoctorAvailabilityForDateThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDoctorAvailabilityForDateThunk.fulfilled, (state, action: PayloadAction<TimeSlot[]>) => {
        state.loading = false;
        console.log('action payloda:', action.payload)
        state.timeSlots = action.payload;
      })
      .addCase(getDoctorAvailabilityForDateThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(bookAppointmentThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bookAppointmentThunk.fulfilled, (state) => {
        state.loading = false;
        if (state.hasFreeBooking && !Object.values(state.activeSubscriptions).some(sub => sub && !sub.isExpired)) {
          state.hasFreeBooking = false;
        }
      })
      .addCase(bookAppointmentThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getPatientSubscriptionThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPatientSubscriptionThunk.fulfilled, (state, action: PayloadAction<Subscription | null, string, { arg: string }>) => {
        state.loading = false;
        if (action.meta.arg) {
          state.activeSubscriptions[action.meta.arg] = action.payload;
        } else {
          state.error = 'Invalid doctorId for subscription';
        }
      })
      .addCase(getPatientSubscriptionThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(checkFreeBookingThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkFreeBookingThunk.fulfilled, (state, action: PayloadAction<boolean>) => {
        state.loading = false;
        state.hasFreeBooking = action.payload;
      })
      .addCase(checkFreeBookingThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getPatientAppointmentsForDoctorThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPatientAppointmentsForDoctorThunk.fulfilled, (state, action: PayloadAction<Appointment[]>) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(getPatientAppointmentsForDoctorThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = patientSlice.actions;
export default patientSlice.reducer;