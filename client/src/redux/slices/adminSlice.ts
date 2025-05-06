import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  listDoctorsThunk,
  createDoctorThunk,
  updateDoctorThunk,
  deleteDoctorThunk,
  blockDoctorThunk,
  verifyDoctorThunk,
  listPatientsThunk,
  createPatientThunk,
  updatePatientThunk,
  deletePatientThunk,
  blockPatientThunk,
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
  totalPages: {
    appointments: number;
    plans: number;
    doctors: number;
    patients: number;
    specialities: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  appointments: [],
  plans: [],
  doctors: [],
  patients: [],
  specialities: [],
  totalPages: {
    appointments: 1,
    plans: 1,
    doctors: 1,
    patients: 1,
    specialities: 1,
  },
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
        console.log("slice dodtors:", action.payload)
        state.doctors = action.payload.doctors;
        state.totalPages.doctors = action.payload.totalPages;
        state.loading = false;
      })
      .addCase(listDoctorsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createDoctorThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDoctorThunk.fulfilled, (state, action) => {
        state.doctors.push(action.payload);
        state.loading = false;
      })
      .addCase(createDoctorThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateDoctorThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDoctorThunk.fulfilled, (state, action) => {
        const index = state.doctors.findIndex((d) => d._id === action.payload._id);
        if (index !== -1) {
          state.doctors[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(updateDoctorThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteDoctorThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDoctorThunk.fulfilled, (state, action) => {
        state.doctors = state.doctors.filter((d) => d._id !== action.payload);
        state.loading = false;
      })
      .addCase(deleteDoctorThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(blockDoctorThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(blockDoctorThunk.fulfilled, (state, action) => {
        const index = state.doctors.findIndex((d) => d._id === action.payload._id);
        if (index !== -1) {
          state.doctors[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(blockDoctorThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyDoctorThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyDoctorThunk.fulfilled, (state, action) => {
        const index = state.doctors.findIndex((d) => d._id === action.payload._id);
        if (index !== -1) {
          state.doctors[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(verifyDoctorThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Patients
    builder
      .addCase(listPatientsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listPatientsThunk.fulfilled, (state, action) => {
        state.patients = action.payload.patients;
        state.totalPages.patients = action.payload.totalPages;
        state.loading = false;
      })
      .addCase(listPatientsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createPatientThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPatientThunk.fulfilled, (state, action) => {
        state.patients.push(action.payload);
        state.loading = false;
      })
      .addCase(createPatientThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updatePatientThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePatientThunk.fulfilled, (state, action) => {
        const index = state.patients.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.patients[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(updatePatientThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deletePatientThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePatientThunk.fulfilled, (state, action) => {
        state.patients = state.patients.filter((p) => p._id !== action.payload);
        state.loading = false;
      })
      .addCase(deletePatientThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(blockPatientThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(blockPatientThunk.fulfilled, (state, action) => {
        const index = state.patients.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.patients[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(blockPatientThunk.rejected, (state, action) => {
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
        state.plans = action.payload.plans;
        state.totalPages.plans = action.payload.totalPages;
        state.loading = false;
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
        state.appointments = action.payload.appointments;
        state.totalPages.appointments = action.payload.totalPages;
        state.loading = false;
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
        state.specialities = action.payload.specialities;
        state.totalPages.specialities = action.payload.totalPages;
        state.loading = false;
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
        state.specialities = state.specialities.filter((s) => s._id !== action.payload);
      })
      .addCase(deleteSpecialityThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete speciality';
      });
  },
});

export const { setLoading, setError, clearError } = adminSlice.actions;
export default adminSlice.reducer;