/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosError } from 'axios';
import api from './api';
import { Appointment, Doctor, Patient, SubscriptionPlan, Speciality } from '../types/authTypes';

interface ApiError {
  message: string;
  status?: number;
}

interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  specialty?: string;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string; 
  sortBy?: string; 
  sortOrder?: 'asc' | 'desc'; 
  status?: string;
  specialty?: string; 
  isBlocked?: boolean; 
  isVerified?: boolean; 
  dateFrom?: string; 
  dateTo?: string; 
}

interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

// Doctors
export const listDoctors = async (params: QueryParams): Promise<PaginatedResponse<Doctor>> => {
  try {
    console.log(params)
    const response = await api.get<PaginatedResponse<Doctor>>('/api/admin/doctors', { params });
    return response.data
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to fetch doctors');
  }
};

export const createDoctor = async (doctor: any): Promise<Doctor> => {
  try {
    const response = await api.post<Doctor>('/api/admin/doctors', doctor);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to create doctor');
  }
};

export const updateDoctor = async (id: string, updates: any): Promise<Doctor> => {
  try {
    const response = await api.patch<Doctor>(`/api/admin/doctors/${id}`, updates);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to update doctor');
  }
};

export const deleteDoctor = async (id: string): Promise<string> => {
  try {
    await api.delete(`/api/admin/doctors/${id}`);
    return id;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to delete doctor');
  }
};

export const blockDoctor = async (id: string, isBlocked: boolean): Promise<Doctor> => {
  try {
    const response = await api.patch<Doctor>(`/api/admin/doctors/${id}/block`, { isBlocked });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to block/unblock doctor');
  }
};

export const verifyDoctor = async (id: string): Promise<Doctor> => {
  try {
    const response = await api.patch<Doctor>(`/api/admin/doctors/${id}/verify`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to verify doctor');
  }
};

// Patients
export const listPatients = async (params: QueryParams): Promise<PaginatedResponse<Patient>> => {
  try {
    const response = await api.get<PaginatedResponse<Patient>>('/api/admin/patients', { params });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to fetch patients');
  }
};

export const createPatient = async (patient: any): Promise<Patient> => {
  try {
    const response = await api.post<Patient>('/api/admin/patients', patient);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to create patient');
  }
};

export const updatePatient = async (id: string, updates: any): Promise<Patient> => {
  try {
    const response = await api.put<Patient>(`/api/admin/patients/${id}`, updates);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to update patient');
  }
};

export const deletePatient = async (id: string): Promise<string> => {
  try {
    await api.delete(`/api/admin/patients/${id}`);
    return id;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to delete patient');
  }
};

export const blockPatient = async (id: string, isBlocked: boolean): Promise<Patient> => {
  try {
    const response = await api.patch<Patient>(`/api/admin/patients/${id}/block`, { isBlocked });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to block/unblock patient');
  }
};

// Appointments
export const getAllAppointments = async (params: QueryParams): Promise<PaginatedResponse<Appointment>> => {
  try {
    const response = await api.get<PaginatedResponse<Appointment>>('/api/admin/appointments', { params });
    console.log('resdata:', response.data)
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to fetch appointments');
  }
};

export const cancelAppointment = async (id: string): Promise<string> => {
  try {
    await api.patch(`/api/admin/appointments/${id}/cancel`);
    return id;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to cancel appointment');
  }
};

// Plans
export const getAllPlans = async (
  params: PaginationParams
): Promise<{ plans: SubscriptionPlan[]; totalPages: number }> => {
  try {
    const response = await api.get<PaginatedResponse<SubscriptionPlan>>('/api/admin/subscription-plans', { params });
    return {
      plans: response.data.data,
      totalPages: response.data.totalPages,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to fetch plans');
  }
};

export const approvePlan = async (id: string): Promise<void> => {
  try {
    await api.patch(`/api/admin/plans/${id}/approve`);
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to approve plan');
  }
};

export const rejectPlan = async (id: string): Promise<void> => {
  try {
    await api.patch(`/api/admin/plans/${id}/reject`);
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to reject plan');
  }
};

export const deletePlan = async (id: string): Promise<string> => {
  try {
    await api.delete(`/api/admin/plans/${id}`);
    return id;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to delete plan');
  }
};

// Specialities
export const getAllSpecialities = async (
  params: PaginationParams
): Promise<{ specialities: Speciality[]; totalPages: number }> => {
  try {
    const response = await api.get<PaginatedResponse<Speciality>>('/api/admin/specialities', { params });
    return {
      specialities: response.data.data,
      totalPages: response.data.totalPages,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to fetch specialities');
  }
};

export const createSpeciality = async (name: string): Promise<Speciality> => {
  try {
    const response = await api.post<Speciality>('/api/admin/specialities', { name });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to create speciality');
  }
};

export const updateSpeciality = async (id: string, name: string): Promise<Speciality> => {
  try {
    const response = await api.put<Speciality>(`/api/admin/specialities/${id}`, { name });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to update speciality');
  }
};

export const deleteSpeciality = async (id: string): Promise<string> => {
  try {
    await api.delete(`/api/admin/specialities/${id}`);
    return id;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data.message || 'Failed to delete speciality');
  }
};