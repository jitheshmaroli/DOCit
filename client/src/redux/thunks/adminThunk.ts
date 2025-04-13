/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { Doctor, Patient } from '../../types/authTypes';
import { RootState, AppDispatch } from '../store';
import { API_BASE_URL } from '../../utils/config';

axios.defaults.withCredentials = true;

export const listDoctors = createAsyncThunk<
  Doctor[],
  void,
  {
    state: RootState;
    dispatch: AppDispatch;
    rejectValue: string;
  }
>('admin/listDoctors', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/auth/admin/doctors`);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || 'Failed to fetch doctors'
    );
  }
});

export const createDoctor = createAsyncThunk(
  'admin/createDoctor',
  async (doctor: any, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/admin/doctors`,
        doctor,
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create doctor'
      );
    }
  }
);

export const updateDoctor = createAsyncThunk(
  'admin/updateDoctor',
  async (
    { id, updates }: { id: string; updates: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/auth/admin/doctors/${id}`,
        updates,
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update doctor'
      );
    }
  }
);

export const deleteDoctor = createAsyncThunk(
  'admin/deleteDoctor',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/auth/admin/doctors/${id}`, {
        withCredentials: true,
      });
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete doctor'
      );
    }
  }
);

export const blockDoctor = createAsyncThunk(
  'admin/blockDoctor',
  async (
    { id, isBlocked }: { id: string; isBlocked: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/auth/admin/doctors/${id}/block`,
        { isBlocked },
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to block/unblock doctor'
      );
    }
  }
);

export const verifyDoctor = createAsyncThunk<
  Doctor,
  string,
  {
    state: RootState;
    dispatch: AppDispatch;
    rejectValue: string;
  }
>('admin/verifyDoctor', async (doctorId, { rejectWithValue }) => {
  try {
    const response = await axios.patch<Doctor>(
      `${API_BASE_URL}/api/auth/admin/verify-doctor/${doctorId}`
    );
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || 'Failed to verify doctor'
    );
  }
});

export const listPatients = createAsyncThunk<
  Patient[],
  void,
  {
    state: RootState;
    dispatch: AppDispatch;
    rejectValue: string;
  }
>('admin/listPatients', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get<Patient[]>(
      `${API_BASE_URL}/api/auth/admin/patients`
    );
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || 'Failed to fetch patients'
    );
  }
});

export const createPatient = createAsyncThunk(
  'admin/createPatient',
  async (patient: any, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/admin/patients`,
        patient,
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create patient'
      );
    }
  }
);

export const updatePatient = createAsyncThunk(
  'admin/updatePatient',
  async (
    { id, updates }: { id: string; updates: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/auth/admin/patients/${id}`,
        updates,
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update patient'
      );
    }
  }
);

export const deletePatient = createAsyncThunk(
  'admin/deletePatient',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/auth/admin/patients/${id}`, {
        withCredentials: true,
      });
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete patient'
      );
    }
  }
);

export const blockPatient = createAsyncThunk(
  'admin/blockPatient',
  async (
    { id, isBlocked }: { id: string; isBlocked: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/auth/admin/patients/${id}/block`,
        { isBlocked },
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to block/unblock patient'
      );
    }
  }
);
