import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  listDoctors, 
  verifyDoctor,
  listPatients,
  getPendingPlans,
  approvePlan,
  rejectPlan, 
} from '../thunks/adminThunk';
import { Doctor, Patient } from '../../types/authTypes';

// Interface for Appointment (adjust based on your schema)
interface Appointment {
  _id: string;
  patientName: string;
  doctorName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

// Interface for Subscription Plan (adjust based on your schema)
interface SubscriptionPlan {
  _id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  status: 'pending' | 'approved' | 'rejected';
  doctorName: string;
}

interface AdminState {
  appointments: Appointment[];
  pendingPlans: SubscriptionPlan[];
  doctors: Doctor[];
  patients: Patient[];
  loading: boolean;
  error: string | null; 
}

const initialState: AdminState = {
  appointments: [],
  pendingPlans: [],
  doctors: [],
  patients: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Doctors
    builder
      .addCase(listDoctors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listDoctors.fulfilled, (state, action) => {
        state.doctors = action.payload;
        state.loading = false;
      })
      .addCase(listDoctors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyDoctor.fulfilled, (state, action) => {
        const index = state.doctors.findIndex(d => d._id === action.payload._id);
        if (index !== -1) {
          state.doctors[index] = action.payload;
        }
      })

    // Patients
    builder
      .addCase(listPatients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listPatients.fulfilled, (state, action) => {
        state.patients = action.payload;
        state.loading = false;
      })
      .addCase(listPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // New cases for subscription plans
      .addCase(getPendingPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPendingPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingPlans = action.payload;
      })
      .addCase(getPendingPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch pending plans';
      })
      .addCase(approvePlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approvePlan.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingPlans = state.pendingPlans.filter(
          (plan) => plan._id !== action.meta.arg
        );
      })
      .addCase(approvePlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to approve plan';
      })
      .addCase(rejectPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingPlans = state.pendingPlans.filter(
          (plan) => plan._id !== action.meta.arg
        );
      })
      .addCase(rejectPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to reject plan';
      });

    // Common error handling
    builder
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.error = action.payload || 'An error occurred';
        }
      );
  },
});

export const { 
  setLoading, 
  setError, 
  clearError,
} = adminSlice.actions;

export default adminSlice.reducer;