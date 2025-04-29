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
import { Doctor, Patient, Appointment, SubscriptionPlan, Speciality } from '../../types/authTypes';
import { RootState, AppDispatch } from '../store';

export const listDoctorsThunk = createAsyncThunk<
  Doctor[],
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('admin/listDoctors', async (_, { rejectWithValue }) => {
  try {
    return await listDoctors();
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch doctors');
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
  async ({ id, updates }: { id: string; updates: any }, { rejectWithValue }) => {
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
  async ({ id, isBlocked }: { id: string; isBlocked: boolean }, { rejectWithValue }) => {
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
  Patient[],
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('admin/listPatients', async (_, { rejectWithValue }) => {
  try {
    return await listPatients();
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch patients');
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
  async ({ id, updates }: { id: string; updates: any }, { rejectWithValue }) => {
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
  async ({ id, isBlocked }: { id: string; isBlocked: boolean }, { rejectWithValue }) => {
    try {
      return await blockPatient(id, isBlocked);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to block/unblock patient');
    }
  }
);

export const getAllAppointmentsThunk = createAsyncThunk<
  Appointment[],
  void,
  { rejectValue: string }
>('admin/getAllAppointments', async (_, { rejectWithValue }) => {
  try {
    const appointments = await getAllAppointments();
    if (!Array.isArray(appointments)) {
      console.error('Expected an array, got:', appointments);
      return [];
    }
    return appointments;
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return rejectWithValue(error.message || 'Failed to fetch appointments');
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
    console.error('Error cancelling appointment:', error);
    return rejectWithValue(error.message || 'Failed to cancel appointment');
  }
});

export const getAllPlansThunk = createAsyncThunk<
  SubscriptionPlan[],
  void,
  { rejectValue: string }
>('admin/getAllPlans', async (_, { rejectWithValue }) => {
  try {
    const plans = await getAllPlans();
    if (!Array.isArray(plans)) {
      console.error('Expected an array, got:', plans);
      return [];
    }
    return plans;
  } catch (error: any) {
    console.error('Error fetching plans:', error);
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
    console.error('Error approving plan:', error);
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
    console.error('Error rejecting plan:', error);
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
    console.error('Error deleting plan:', error);
    return rejectWithValue(error.message || 'Failed to delete plan');
  }
});

export const getAllSpecialitiesThunk = createAsyncThunk<
  Speciality[],
  void,
  { rejectValue: string }
>('admin/getAllSpecialities', async (_, { rejectWithValue }) => {
  try {
    const specialities = await getAllSpecialities();
    if (!Array.isArray(specialities)) {
      console.error('Expected an array, got:', specialities);
      return [];
    }
    return specialities;
  } catch (error: any) {
    console.error('Error fetching specialities:', error);
    return rejectWithValue(error.message || 'Failed to fetch specialities');
  }
});

export const createSpecialityThunk = createAsyncThunk<
  Speciality,
  string,
  { rejectValue: string }
>('admin/createSpeciality', async (name, { rejectWithValue }) => {
  try {
    return await createSpeciality(name);
  } catch (error: any) {
    console.error('Error creating speciality:', error);
    return rejectWithValue(error.message || 'Failed to create speciality');
  }
});

export const updateSpecialityThunk = createAsyncThunk<
  Speciality,
  { id: string; name: string },
  { rejectValue: string }
>('admin/updateSpeciality', async ({ id, name }, { rejectWithValue }) => {
  try {
    return await updateSpeciality(id, name);
  } catch (error: any) {
    console.error('Error updating speciality:', error);
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
    console.error('Error deleting speciality:', error);
    return rejectWithValue(error.message || 'Failed to delete speciality');
  }
});