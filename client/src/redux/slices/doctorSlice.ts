import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Appointment, Doctor, SubscriptionPlan } from '../../types/authTypes';
import {
  createSubscriptionPlanThunk,
  fetchVerifiedDoctorsThunk,
  fetchDoctorByIdThunk,
  getAppointmentsThunk,
  getAvailabilityThunk,
  getSubscriptionPlansThunk,
  setAvailabilityThunk,
  updateSubscriptionPlanThunk,
  deleteSubscriptionPlanThunk,
  withdrawSubscriptionPlanThunk,
  subscribeToPlanThunk,
  fetchDoctorPlansThunk,
  removeSlotThunk,
  updateSlotThunk,
} from '../thunks/doctorThunk';

interface DoctorState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  availability: any[];
  doctors: Doctor[];
  selectedDoctor: Doctor | null;
  doctorPlans: { [doctorId: string]: SubscriptionPlan[] };
  loading: boolean;
  error: string | null;
  appointments: Appointment[];
  plans: SubscriptionPlan[];
  subscriptionStatus: 'idle' | 'pending' | 'success' | 'failed';
}

const initialState: DoctorState = {
  appointments: [],
  plans: [],
  doctorPlans: {},
  availability: [],
  doctors: [],
  selectedDoctor: null,
  loading: false,
  error: null,
  subscriptionStatus: 'idle',
};

const doctorSlice = createSlice({
  name: 'doctors',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetSubscriptionStatus: (state) => {
      state.subscriptionStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVerifiedDoctorsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVerifiedDoctorsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.doctors = action.payload;
      })
      .addCase(fetchVerifiedDoctorsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDoctorByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchDoctorByIdThunk.fulfilled,
        (state, action: PayloadAction<Doctor>) => {
          state.loading = false;
          state.selectedDoctor = action.payload;
        }
      )
      .addCase(fetchDoctorByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDoctorPlansThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchDoctorPlansThunk.fulfilled,
        (
          state,
          action: PayloadAction<{ doctorId: string; plans: SubscriptionPlan[] }>
        ) => {
          state.loading = false;
          state.doctorPlans[action.payload.doctorId] = action.payload.plans;
        }
      )
      .addCase(fetchDoctorPlansThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getAvailabilityThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAvailabilityThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.availability = action.payload;
      })
      .addCase(getAvailabilityThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(setAvailabilityThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setAvailabilityThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(setAvailabilityThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(removeSlotThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeSlotThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(removeSlotThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateSlotThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSlotThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateSlotThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(subscribeToPlanThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.subscriptionStatus = 'pending';
      })
      .addCase(subscribeToPlanThunk.fulfilled, (state) => {
        state.loading = false;
        state.subscriptionStatus = 'success';
      })
      .addCase(subscribeToPlanThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.subscriptionStatus = 'failed';
      })
      .addCase(getAppointmentsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAppointmentsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(getAppointmentsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getSubscriptionPlansThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSubscriptionPlansThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload;
      })
      .addCase(getSubscriptionPlansThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createSubscriptionPlanThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubscriptionPlanThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.plans.push(action.payload);
      })
      .addCase(createSubscriptionPlanThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateSubscriptionPlanThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSubscriptionPlanThunk.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.plans.findIndex(
          (plan) => plan._id === action.payload._id
        );
        if (index !== -1) {
          state.plans[index] = action.payload;
        }
      })
      .addCase(updateSubscriptionPlanThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteSubscriptionPlanThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSubscriptionPlanThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = state.plans.filter(
          (plan) => plan._id !== action.payload.id
        );
      })
      .addCase(deleteSubscriptionPlanThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(withdrawSubscriptionPlanThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(withdrawSubscriptionPlanThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = state.plans.filter(
          (plan) => plan._id !== action.payload.id
        );
      })
      .addCase(withdrawSubscriptionPlanThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, resetSubscriptionStatus } = doctorSlice.actions;
export default doctorSlice.reducer;
