import { createSlice } from "@reduxjs/toolkit";
import { getDoctorAvailability, bookAppointment } from "../thunks/patientThunk";

interface PatientState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doctorAvailability: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appointments: any[];
  loading: boolean;
  error: string | null;
}

const initialState: PatientState = {
  doctorAvailability: [],
  appointments: [],
  loading: false,
  error: null,
};

const patientSlice = createSlice({
  name: "patient",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getDoctorAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDoctorAvailability.fulfilled, (state, action) => {
        state.loading = false;
        state.doctorAvailability = action.payload;
      })
      .addCase(getDoctorAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(bookAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bookAppointment.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments.push(action.payload);
      })
      .addCase(bookAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default patientSlice.reducer;