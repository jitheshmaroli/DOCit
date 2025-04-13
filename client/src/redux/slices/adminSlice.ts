import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  listDoctors, 
  verifyDoctor,
  listPatients, 
} from '../thunks/adminThunk';
import { Doctor, Patient } from '../../types/authTypes';

interface AdminState {
  doctors: Doctor[];
  patients: Patient[];
  loading: boolean;
  error: string | null; 
}

const initialState: AdminState = {
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