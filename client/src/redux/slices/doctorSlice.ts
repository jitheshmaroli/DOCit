import { createSlice } from '@reduxjs/toolkit';
import { Doctor } from '../../types/authTypes';
import { createSubscriptionPlan, fetchVerifiedDoctors, getAppointments, getAvailability, getSubscriptionPlans, setAvailability } from '../thunks/doctorThunk';
import moment from 'moment';

// Interface for Appointment (adjust based on your schema)
interface Appointment {
  _id: string;
  patientName: string;
  doctorName?: string;
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
  doctorName?: string;
}

interface DoctorState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  availability: any[];
  doctors: Doctor[];
  loading: boolean;
  error: string | null;
  appointments: Appointment[];
  plans: SubscriptionPlan[];
}

const initialState: DoctorState = {
  appointments: [],
  plans: [],
  availability: [],
  doctors: [],
  loading: false,
  error: null,
};

const doctorSlice = createSlice({
  name: 'doctors',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVerifiedDoctors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVerifiedDoctors.fulfilled, (state, action) => {
        state.doctors = action.payload;
        state.loading = false;
      })
      .addCase(fetchVerifiedDoctors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load doctors';
      });
    builder
      .addCase(setAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setAvailability.fulfilled, (state, action) => {
        state.loading = false;
        const updatedAvailability = action.payload;
        const index = state.availability.findIndex((a) =>
          moment(a.date).isSame(updatedAvailability.date, 'day')
        );
        if (index !== -1) {
          state.availability[index] = updatedAvailability;
        } else {
          state.availability.push(updatedAvailability);
        }
      })
      .addCase(setAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAvailability.fulfilled, (state, action) => {
        state.loading = false;
        state.availability = action.payload;
      })
      .addCase(getAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(getAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch appointments';
      })
      // New cases for subscription plans
      .addCase(getSubscriptionPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSubscriptionPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload || 'Failed to fetch subscription plans';
      })
      .addCase(getSubscriptionPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch subscription plans';
      })
      .addCase(createSubscriptionPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubscriptionPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.plans.push(action.payload);
      })
      .addCase(createSubscriptionPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create subscription plan';
      });
  },
});

export default doctorSlice.reducer;
