import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/config';

axios.defaults.withCredentials = true;

export const getDoctorAvailability = createAsyncThunk(
  'patient/getDoctorAvailability',
  async (
    {
      doctorId,
      startDate,
      endDate,
    }: { doctorId: string; startDate: Date; endDate: Date },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/patients/doctors/${doctorId}/availability`,
        {
          params: { startDate, endDate },
          withCredentials: true,
        }
      );
      return response.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch availability'
      );
    }
  }
);

export const bookAppointment = createAsyncThunk(
  'patient/bookAppointment',
  async (
    {
      doctorId,
      date,
      startTime,
      endTime,
    }: { doctorId: string; date: Date; startTime: string; endTime: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/patients/appointments`,
        { doctorId, date, startTime, endTime },
        { withCredentials: true }
      );
      return response.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to book appointment'
      );
    }
  }
);
