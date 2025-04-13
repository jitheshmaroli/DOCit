import { createSlice } from '@reduxjs/toolkit';
import { Doctor } from '../../types/authTypes';
import { fetchVerifiedDoctors, getAvailability, setAvailability } from '../thunks/doctorThunk';
import moment from 'moment';

interface DoctorState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  availability: any[];
  doctors: Doctor[];
  loading: boolean;
  error: string | null;
}

const initialState: DoctorState = {
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
      });
  },
});

export default doctorSlice.reducer;
