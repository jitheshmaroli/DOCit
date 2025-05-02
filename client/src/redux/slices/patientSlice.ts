import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  getDoctorAvailabilityThunk,
  getDoctorAvailabilityForDateThunk,
  bookAppointmentThunk,
  getPatientSubscriptionThunk,
  getPatientAppointmentsForDoctorThunk,
  getPatientAppointmentsThunk,
  cancelAppointmentThunk,
} from '../../redux/thunks/patientThunk';
import { AvailabilityPayload, TimeSlot } from '../../types/authTypes';

interface PatientSubscription {
  _id: string;
  plan: {
    _id: string;
    name: string;
    description: string;
    price: number;
    validityDays: number;
    appointmentCount: number;
  };
  daysUntilExpiration: number;
  isExpired: boolean;
  appointmentsLeft: number;
  status: string;
}

interface Appointment {
  _id: string;
  patientId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  isFreeBooking: boolean;
  bookingTime: string;
  createdAt: string;
}

interface PatientState {
  activeSubscriptions: { [doctorId: string]: PatientSubscription | null };
  appointments: Appointment[];
  availability: AvailabilityPayload[];
  timeSlots: TimeSlot[];
  canBookFree: { [doctorId: string]: boolean };
  loading: boolean;
  error: string | null;
}

const initialState: PatientState = {
  activeSubscriptions: {},
  appointments: [],
  availability: [],
  timeSlots: [],
  canBookFree: {},
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
      .addCase(
        getDoctorAvailabilityThunk.fulfilled,
        (state, action: PayloadAction<AvailabilityPayload[]>) => {
          state.availability = action.payload;
          state.loading = false;
        }
      )
      .addCase(getDoctorAvailabilityThunk.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })
      .addCase(getDoctorAvailabilityForDateThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getDoctorAvailabilityForDateThunk.fulfilled,
        (state, action: PayloadAction<TimeSlot[]>) => {
          state.timeSlots = action.payload;
          state.loading = false;
        }
      )
      .addCase(getDoctorAvailabilityForDateThunk.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })
      .addCase(bookAppointmentThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bookAppointmentThunk.fulfilled, (state, action) => {
        state.appointments.push(action.payload);
        state.loading = false;
      })
      .addCase(bookAppointmentThunk.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })
      .addCase(getPatientSubscriptionThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPatientSubscriptionThunk.fulfilled, (state, action: PayloadAction<PatientSubscription | null, string, { arg: string }>) => {
        state.loading = false;
        if (action.meta.arg) {
          state.activeSubscriptions[action.meta.arg] = action.payload;
        } else {
          state.error = 'Invalid doctorId for subscription';
        }
      })
      .addCase(getPatientSubscriptionThunk.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })
      .addCase(getPatientAppointmentsForDoctorThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getPatientAppointmentsForDoctorThunk.fulfilled,
        (state, action: PayloadAction<{ appointments: Appointment[]; canBookFree: boolean }>) => {
          state.appointments = action.payload.appointments;
          state.canBookFree[action.payload.appointments[0]?.doctorId || ''] = action.payload.canBookFree;
          state.loading = false;
        }
      )
      .addCase(getPatientAppointmentsForDoctorThunk.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })
      .addCase(getPatientAppointmentsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getPatientAppointmentsThunk.fulfilled,
        (state, action: PayloadAction<Appointment[]>) => {
          state.appointments = action.payload;
          state.loading = false;
        }
      )
      .addCase(getPatientAppointmentsThunk.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })
      .addCase(cancelAppointmentThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelAppointmentThunk.fulfilled, (state, action) => {
        state.appointments = state.appointments.filter(
          (appt) => appt._id !== action.meta.arg
        );
        state.loading = false;
      })
      .addCase(cancelAppointmentThunk.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      });
  },
});

export const { clearError } = patientSlice.actions;
export default patientSlice.reducer;