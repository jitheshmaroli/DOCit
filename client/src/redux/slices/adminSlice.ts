import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  listDoctorsThunk,
  verifyDoctorThunk,
  listPatientsThunk,
  getAllPlansThunk,
  approvePlanThunk,
  rejectPlanThunk,
  deletePlanThunk,
  cancelAppointmentThunk,
  getAllAppointmentsThunk,
  getAllSpecialitiesThunk,
  createSpecialityThunk,
  updateSpecialityThunk,
  deleteSpecialityThunk,
} from '../thunks/adminThunk';
import { Appointment, Doctor, Patient, SubscriptionPlan, Speciality } from '../../types/authTypes';

interface AdminState {
  appointments: Appointment[];
  plans: SubscriptionPlan[];
  doctors: Doctor[];
  patients: Patient[];
  specialities: Speciality[];
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  appointments: [],
  plans: [],
  doctors: [],
  patients: [],
  specialities: [],
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
      .addCase(listDoctorsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listDoctorsThunk.fulfilled, (state, action) => {
        state.doctors = action.payload;
        state.loading = false;
      })
      .addCase(listDoctorsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyDoctorThunk.fulfilled, (state, action) => {
        const index = state.doctors.findIndex((d) => d._id === action.payload._id);
        if (index !== -1) {
          state.doctors[index] = action.payload;
        }
      });

    // Patients
    builder
      .addCase(listPatientsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listPatientsThunk.fulfilled, (state, action) => {
        state.patients = action.payload;
        state.loading = false;
      })
      .addCase(listPatientsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Plans
    builder
      .addCase(getAllPlansThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllPlansThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload || [];
      })
      .addCase(getAllPlansThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch plans';
      })
      .addCase(approvePlanThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approvePlanThunk.fulfilled, (state, action) => {
        state.loading = false;
        const plan = state.plans.find((p) => p._id === action.meta.arg);
        if (plan) {
          plan.status = 'approved';
        }
      })
      .addCase(approvePlanThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to approve plan';
      })
      .addCase(rejectPlanThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectPlanThunk.fulfilled, (state, action) => {
        state.loading = false;
        const plan = state.plans.find((p) => p._id === action.meta.arg);
        if (plan) {
          plan.status = 'rejected';
        }
      })
      .addCase(rejectPlanThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to reject plan';
      })
      .addCase(deletePlanThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePlanThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = state.plans.filter((plan) => plan._id !== action.payload);
      })
      .addCase(deletePlanThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete plan';
      });

    // Appointments
    builder
      .addCase(getAllAppointmentsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllAppointmentsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload || [];
      })
      .addCase(getAllAppointmentsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch appointments';
      })
      .addCase(cancelAppointmentThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelAppointmentThunk.fulfilled, (state, action) => {
        state.loading = false;
        const appointment = state.appointments.find((a) => a._id === action.payload);
        if (appointment) {
          appointment.status = 'cancelled';
        }
      })
      .addCase(cancelAppointmentThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to cancel appointment';
      });

    // Specialities
    builder
      .addCase(getAllSpecialitiesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllSpecialitiesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.specialities = action.payload || [];
      })
      .addCase(getAllSpecialitiesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch specialities';
      })
      .addCase(createSpecialityThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSpecialityThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.specialities.push(action.payload);
      })
      .addCase(createSpecialityThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create speciality';
      })
      .addCase(updateSpecialityThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSpecialityThunk.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.specialities.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) {
          state.specialities[index] = action.payload;
        }
      })
      .addCase(updateSpecialityThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update speciality';
      })
      .addCase(deleteSpecialityThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSpecialityThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.specialities = state.specialities.filter((speciality) => speciality._id !== action.payload);
      })
      .addCase(deleteSpecialityThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete speciality';
      });

    // Common error handling
    builder.addMatcher(
      (action) => action.type.endsWith('/rejected'),
      (state, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload || 'An error occurred';
      }
    );
  },
});

export const { setLoading, setError, clearError } = adminSlice.actions;

export default adminSlice.reducer;