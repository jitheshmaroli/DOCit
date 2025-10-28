/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  listDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  blockDoctor,
  verifyDoctor,
  listPatients,
  createPatient,
  updatePatient,
  deletePatient,
  blockPatient,
  getAllAppointments,
  cancelAppointment,
  getAllPlans,
  approvePlan,
  rejectPlan,
  deletePlan,
  getAllSpecialities,
  createSpeciality,
  updateSpeciality,
  deleteSpeciality,
} from '../../services/adminService';
import {
  Doctor,
  Patient,
  Appointment,
  Speciality,
  PaginatedResponse,
  QueryParams,
  PaginationParams,
} from '../../types/authTypes';
import { RootState, AppDispatch } from '../store';
import { SubscriptionPlan } from '../../types/subscriptionTypes';

export const listDoctorsThunk = createAsyncThunk<
  PaginatedResponse<Doctor>,
  QueryParams
>('admin/listDoctors', async (params, { rejectWithValue }) => {
  try {
    return await listDoctors(params);
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const createDoctorThunk = createAsyncThunk(
  'admin/createDoctor',
  async (doctor: any, { rejectWithValue }) => {
    try {
      return await createDoctor(doctor);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create doctor');
    }
  }
);

export const updateDoctorThunk = createAsyncThunk(
  'admin/updateDoctor',
  async (
    { id, updates }: { id: string; updates: any },
    { rejectWithValue }
  ) => {
    try {
      return await updateDoctor(id, updates);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update doctor');
    }
  }
);

export const deleteDoctorThunk = createAsyncThunk(
  'admin/deleteDoctor',
  async (id: string, { rejectWithValue }) => {
    try {
      return await deleteDoctor(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete doctor');
    }
  }
);

export const blockDoctorThunk = createAsyncThunk(
  'admin/blockDoctor',
  async (
    { id, isBlocked }: { id: string; isBlocked: boolean },
    { rejectWithValue }
  ) => {
    try {
      return await blockDoctor(id, isBlocked);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to block/unblock doctor');
    }
  }
);

export const verifyDoctorThunk = createAsyncThunk<
  Doctor,
  string,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('admin/verifyDoctor', async (doctorId, { rejectWithValue }) => {
  try {
    return await verifyDoctor(doctorId);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to verify doctor');
  }
});

export const listPatientsThunk = createAsyncThunk<
  PaginatedResponse<Patient>,
  PaginationParams
>('admin/listPatients', async (params, { rejectWithValue }) => {
  try {
    return await listPatients(params);
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const createPatientThunk = createAsyncThunk(
  'admin/createPatient',
  async (patient: any, { rejectWithValue }) => {
    try {
      return await createPatient(patient);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create patient');
    }
  }
);

export const updatePatientThunk = createAsyncThunk(
  'admin/updatePatient',
  async (
    { id, updates }: { id: string; updates: any },
    { rejectWithValue }
  ) => {
    try {
      return await updatePatient(id, updates);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update patient');
    }
  }
);

export const deletePatientThunk = createAsyncThunk(
  'admin/deletePatient',
  async (id: string, { rejectWithValue }) => {
    try {
      return await deletePatient(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete patient');
    }
  }
);

export const blockPatientThunk = createAsyncThunk(
  'admin/blockPatient',
  async (
    { id, isBlocked }: { id: string; isBlocked: boolean },
    { rejectWithValue }
  ) => {
    try {
      return await blockPatient(id, isBlocked);
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to block/unblock patient'
      );
    }
  }
);

export const getAllAppointmentsThunk = createAsyncThunk<
  PaginatedResponse<Appointment>,
  PaginationParams
>('admin/getAllAppointments', async (params, { rejectWithValue }) => {
  try {
    return await getAllAppointments(params);
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const cancelAppointmentThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('admin/cancelAppointment', async (appointmentId, { rejectWithValue }) => {
  try {
    return await cancelAppointment(appointmentId);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to cancel appointment');
  }
});

export const getAllPlansThunk = createAsyncThunk<
  { plans: SubscriptionPlan[]; totalPages: number },
  PaginationParams,
  { rejectValue: string }
>('admin/getAllPlans', async ({ page, limit, search }, { rejectWithValue }) => {
  try {
    const response = await getAllPlans({ page, limit, search });
    return response;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch plans');
  }
});

export const approvePlanThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>('admin/approvePlan', async (planId, { rejectWithValue }) => {
  try {
    await approvePlan(planId);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to approve plan');
  }
});

export const rejectPlanThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>('admin/rejectPlan', async (planId, { rejectWithValue }) => {
  try {
    await rejectPlan(planId);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to reject plan');
  }
});

export const deletePlanThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('admin/deletePlan', async (planId, { rejectWithValue }) => {
  try {
    return await deletePlan(planId);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to delete plan');
  }
});

export const getAllSpecialitiesThunk = createAsyncThunk<
  { specialities: Speciality[]; totalPages: number },
  PaginationParams,
  { rejectValue: string }
>(
  'admin/getAllSpecialities',
  async ({ page, limit, search }, { rejectWithValue }) => {
    try {
      const response = await getAllSpecialities({ page, limit, search });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch specialities');
    }
  }
);

export const createSpecialityThunk = createAsyncThunk<
  Speciality,
  string,
  { rejectValue: string }
>('admin/createSpeciality', async (name, { rejectWithValue }) => {
  try {
    return await createSpeciality(name);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to create speciality');
  }
});

export const updateSpecialityThunk = createAsyncThunk<
  Speciality,
  { id: string; specialityName: string },
  { rejectValue: string }
>('admin/updateSpeciality', async ({ id, specialityName }, { rejectWithValue }) => {
  try {
    return await updateSpeciality(id, specialityName);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to update speciality');
  }
});

export const deleteSpecialityThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('admin/deleteSpeciality', async (specialityId, { rejectWithValue }) => {
  try {
    return await deleteSpeciality(specialityId);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to delete speciality');
  }
});
