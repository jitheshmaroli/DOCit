import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { Doctor } from '../../types/authTypes';
import { API_BASE_URL } from '../../utils/config';

axios.defaults.withCredentials = true;

interface Appointment {
  _id: string;
  patientName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface SubscriptionPlan {
  _id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  status: 'pending' | 'approved' | 'rejected';
  doctorName?: string;
}

export const getAppointments = createAsyncThunk<
  Appointment[],
  void,
  { rejectValue: string }
>('doctor/getAppointments', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/doctors/appointments`, {
      withCredentials: true,
    });
    return response.data.data; // Adjust based on your API response structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || 'Failed to fetch appointments'
    );
  }
});

// Thunk to fetch doctor's subscription plans
export const getSubscriptionPlans = createAsyncThunk<
  SubscriptionPlan[],
  void,
  { rejectValue: string }
>('doctor/getSubscriptionPlans', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/doctors/subscription-plans`, {
      withCredentials: true,
    });
    return response.data.data; // Adjust based on your API response structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || 'Failed to fetch subscription plans'
    );
  }
});

// Thunk to create a subscription plan
export const createSubscriptionPlan = createAsyncThunk<
  SubscriptionPlan,
  { title: string; description: string; price: number; duration: number },
  { rejectValue: string }
>(
  'doctor/createSubscriptionPlan',
  async (planData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/doctors/subscription-plans`,
        planData,
        { withCredentials: true }
      );
      return response.data.data; // Adjust based on your API response structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create subscription plan'
      );
    }
  }
);

export const fetchVerifiedDoctors = createAsyncThunk<
  Doctor[],
  void,
  {
    rejectValue: string;
  }
>('doctors/fetchVerified', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get<Doctor[]>(
      `${API_BASE_URL}/api/auth/patient/verified-doctors`
    );
    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || 'Failed to fetch verified doctors'
    );
  }
});

export const setAvailability = createAsyncThunk(
  'doctor/setAvailability',
  async (
    {
      date,
      timeSlots,
    }: { date: Date; timeSlots: { startTime: string; endTime: string }[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/doctors/availability`,
        { date, timeSlots },
        { withCredentials: true }
      );
      return response.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to set availability'
      );
    }
  }
);

export const getAvailability = createAsyncThunk(
  'doctor/getAvailability',
  async (
    { startDate, endDate }: { startDate: Date; endDate: Date },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/doctors/availability`,
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
