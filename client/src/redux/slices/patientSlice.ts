import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  getDoctorAvailabilityThunk,
  getDoctorAvailabilityForDateThunk,
  bookAppointmentThunk,
  getPatientSubscriptionThunk,
  getPatientAppointmentsForDoctorThunk,
  getPatientAppointmentsThunk,
  cancelAppointmentThunk,
  cancelSubscriptionThunk,
} from '../../redux/thunks/patientThunk';
import {
  AvailabilityPayload,
  TimeSlot,
  Appointment,
} from '../../types/authTypes';

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
  createdAt?: string;
}

interface CancelSubscriptionResponse {
  refundId: string;
  cardLast4?: string;
  amount: number;
}

interface PatientState {
  activeSubscriptions: { [doctorId: string]: PatientSubscription | null };
  appointments: Appointment[];
  totalItems: number;
  availability: AvailabilityPayload[];
  timeSlots: TimeSlot[];
  canBookFree: boolean;
  loading: boolean;
  error: string | null;
  lastRefundDetails: CancelSubscriptionResponse | null;
}

const initialState: PatientState = {
  activeSubscriptions: {},
  appointments: [],
  totalItems: 0,
  availability: [],
  timeSlots: [],
  canBookFree: true,
  loading: false,
  error: null,
  lastRefundDetails: null,
};

const patientSlice = createSlice({
  name: 'patient',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearRefundDetails: (state) => {
      state.lastRefundDetails = null;
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
      .addCase(
        getPatientSubscriptionThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            PatientSubscription | null,
            string,
            { arg: string }
          >
        ) => {
          state.loading = false;
          if (action.meta.arg) {
            state.activeSubscriptions[action.meta.arg] = action.payload;
          } else {
            state.error = 'Invalid doctorId for subscription';
          }
        }
      )
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
        (
          state,
          action: PayloadAction<{
            appointments: Appointment[];
            totalItems: number;
            canBookFree?: boolean;
          }>
        ) => {
          state.appointments = action.payload.appointments;
          state.totalItems = action.payload.totalItems;
          state.canBookFree = action.payload.canBookFree ?? state.canBookFree;
          state.loading = false;
        }
      )
      .addCase(
        getPatientAppointmentsForDoctorThunk.rejected,
        (state, action) => {
          state.error = action.payload as string;
          state.loading = false;
        }
      )
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
          (appt) => appt._id !== action.meta.arg.appointmentId
        );
        state.loading = false;
      })
      .addCase(cancelAppointmentThunk.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })
      .addCase(cancelSubscriptionThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.lastRefundDetails = null;
      })
      .addCase(
        cancelSubscriptionThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            CancelSubscriptionResponse,
            string,
            { arg: { subscriptionId: string; cancellationReason?: string } }
          >
        ) => {
          const subscriptionId = action.meta.arg.subscriptionId;
          Object.keys(state.activeSubscriptions).forEach((doctorId) => {
            if (state.activeSubscriptions[doctorId]?._id === subscriptionId) {
              state.activeSubscriptions[doctorId] = null;
            }
          });
          state.lastRefundDetails = action.payload;
          state.loading = false;
        }
      )
      .addCase(cancelSubscriptionThunk.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      });
  },
});

export const { clearError, clearRefundDetails } = patientSlice.actions;
export default patientSlice.reducer;
