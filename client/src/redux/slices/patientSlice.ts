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
  getPatientSubscriptionsThunk,
} from '../thunks/patientThunk';
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
    doctorId: string;
    doctorName?: string;
  };
  daysUntilExpiration: number;
  isExpired: boolean;
  appointmentsLeft: number;
  status: string;
  createdAt?: string;
  expiryDate?: string;
}

interface CancelSubscriptionResponse {
  refundId: string;
  cardLast4?: string;
  amount: number;
}

interface PatientState {
  activeSubscriptions: PatientSubscription[];
  appointments: { [doctorId: string]: Appointment[] };
  totalItems: number;
  availability: AvailabilityPayload[];
  timeSlots: TimeSlot[];
  canBookFree: boolean;
  loading: boolean;
  error: string | null;
  lastRefundDetails: CancelSubscriptionResponse | null;
}

const initialState: PatientState = {
  activeSubscriptions: [],
  appointments: {},
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
        const appointment = action.payload;
        const doctorId = appointment.doctorId._id;
        if (!state.appointments[doctorId]) {
          state.appointments[doctorId] = [];
        }
        state.appointments[doctorId].push(appointment);
        state.loading = false;
      })
      .addCase(bookAppointmentThunk.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })
      .addCase(getPatientSubscriptionsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getPatientSubscriptionsThunk.fulfilled,
        (state, action: PayloadAction<PatientSubscription[]>) => {
          state.loading = false;
          state.activeSubscriptions = action.payload;
        }
      )
      .addCase(getPatientSubscriptionsThunk.rejected, (state, action) => {
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
          if (action.payload) {
            const existingIndex = state.activeSubscriptions.findIndex(
              (sub) => sub._id === action.payload?._id
            );
            if (existingIndex >= 0) {
              state.activeSubscriptions[existingIndex] = action.payload;
            } else {
              state.activeSubscriptions.push(action.payload);
            }
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
          action: PayloadAction<
            {
              appointments: Appointment[];
              totalItems: number;
              canBookFree?: boolean;
            },
            string,
            { arg: { doctorId: string } }
          >
        ) => {
          const doctorId = action.meta.arg.doctorId;
          state.appointments[doctorId] = action.payload.appointments;
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
          // Clear existing appointments and group by doctorId
          state.appointments = {};
          action.payload.forEach((appt) => {
            const doctorId = appt.doctorId._id;
            if (!state.appointments[doctorId]) {
              state.appointments[doctorId] = [];
            }
            state.appointments[doctorId].push(appt);
          });
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
        const appointmentId = action.meta.arg.appointmentId;
        Object.keys(state.appointments).forEach((doctorId) => {
          state.appointments[doctorId] = state.appointments[doctorId].filter(
            (appt) => appt._id !== appointmentId
          );
        });
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
          state.activeSubscriptions = state.activeSubscriptions.map((sub) =>
            sub._id === action.meta.arg.subscriptionId
              ? { ...sub, status: 'cancelled' }
              : sub
          );
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
