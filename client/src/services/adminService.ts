import { AxiosError } from 'axios';
import api from './api';
import {
  Appointment,
  Doctor,
  Patient,
  SubscriptionPlan,
  Speciality,
} from '../types/authTypes';
import { ROUTES } from '../constants/routeConstants';

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

interface TopSubscriber {
  patientId: string;
  patientName: string;
  subscriptionCount: number;
  totalSpent: number;
}

interface TopPatient {
  patientId: string;
  patientName: string;
  appointmentCount: number;
}

interface TopDoctor {
  doctorId: string;
  doctorName: string;
  subscriberCount: number;
}

interface DashboardStats {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  activePlans: number;
  totalRevenue: number;
  topSubscribers: TopSubscriber[];
  topPatients: TopPatient[];
  topDoctors: TopDoctor[];
}

interface ReportFilter {
  type: 'daily' | 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
}

interface ReportData {
  daily?: Array<{ date: string; appointments: number; revenue: number }>;
  monthly?: Array<{ month: string; appointments: number; revenue: number }>;
  yearly?: Array<{ year: string; appointments: number; revenue: number }>;
}

// Doctors
export const listDoctors = async (
  params: QueryParams
): Promise<PaginatedResponse<Doctor>> => {
  try {
    const response = await api.get<PaginatedResponse<Doctor>>(
      ROUTES.API.ADMIN.DOCTORS,
      { params }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to fetch doctors'
    );
  }
};

export const createDoctor = async (
  doctor: Partial<Doctor>
): Promise<Doctor> => {
  try {
    const response = await api.post<Doctor>(ROUTES.API.ADMIN.DOCTORS, doctor);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to create doctor'
    );
  }
};

export const updateDoctor = async (
  id: string,
  updates: Partial<Doctor>
): Promise<Doctor> => {
  try {
    const response = await api.patch<Doctor>(
      ROUTES.API.ADMIN.DOCTOR_BY_ID.replace(':id', id),
      updates
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to update doctor'
    );
  }
};

export const deleteDoctor = async (id: string): Promise<string> => {
  try {
    await api.delete(ROUTES.API.ADMIN.DOCTOR_BY_ID.replace(':id', id));
    return id;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to delete doctor'
    );
  }
};

export const blockDoctor = async (
  id: string,
  isBlocked: boolean
): Promise<Doctor> => {
  try {
    const response = await api.patch<Doctor>(
      ROUTES.API.ADMIN.BLOCK_DOCTOR.replace(':id', id),
      { isBlocked }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to block/unblock doctor'
    );
  }
};

export const verifyDoctor = async (id: string): Promise<Doctor> => {
  try {
    const response = await api.patch<Doctor>(
      ROUTES.API.ADMIN.VERIFY_DOCTOR.replace(':id', id)
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to verify doctor'
    );
  }
};

// Patients
export const listPatients = async (
  params: QueryParams
): Promise<PaginatedResponse<Patient>> => {
  try {
    const response = await api.get<PaginatedResponse<Patient>>(
      ROUTES.API.ADMIN.PATIENTS,
      { params }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to fetch patients'
    );
  }
};

export const createPatient = async (
  patient: Partial<Patient>
): Promise<Patient> => {
  try {
    const response = await api.post<Patient>(
      ROUTES.API.ADMIN.PATIENTS,
      patient
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to create patient'
    );
  }
};

export const updatePatient = async (
  id: string,
  updates: Partial<Patient>
): Promise<Patient> => {
  try {
    const response = await api.put<Patient>(
      ROUTES.API.ADMIN.PATIENT_BY_ID.replace(':id', id),
      updates
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to update patient'
    );
  }
};

export const deletePatient = async (id: string): Promise<string> => {
  try {
    await api.delete(ROUTES.API.ADMIN.PATIENT_BY_ID.replace(':id', id));
    return id;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to delete patient'
    );
  }
};

export const blockPatient = async (
  id: string,
  isBlocked: boolean
): Promise<Patient> => {
  try {
    const response = await api.patch<Patient>(
      ROUTES.API.ADMIN.BLOCK_PATIENT.replace(':id', id),
      { isBlocked }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to block/unblock patient'
    );
  }
};

// Appointments
export const getAllAppointments = async (
  params: QueryParams
): Promise<PaginatedResponse<Appointment>> => {
  try {
    const response = await api.get<PaginatedResponse<Appointment>>(
      ROUTES.API.ADMIN.APPOINTMENTS,
      { params }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to fetch appointments'
    );
  }
};

export const cancelAppointment = async (id: string): Promise<string> => {
  try {
    await api.patch(ROUTES.API.ADMIN.CANCEL_APPOINTMENT.replace(':id', id));
    return id;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to cancel appointment'
    );
  }
};

// Plans
export const getAllPlans = async (
  params: PaginationParams
): Promise<{ plans: SubscriptionPlan[]; totalPages: number }> => {
  try {
    const response = await api.get<PaginatedResponse<SubscriptionPlan>>(
      ROUTES.API.ADMIN.SUBSCRIPTION_PLANS,
      { params }
    );
    return {
      plans: response.data.data,
      totalPages: response.data.totalPages,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to fetch plans'
    );
  }
};

export const approvePlan = async (id: string): Promise<void> => {
  try {
    await api.put(ROUTES.API.ADMIN.APPROVE_PLAN.replace(':id', id));
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to approve plan'
    );
  }
};

export const rejectPlan = async (id: string): Promise<void> => {
  try {
    await api.put(ROUTES.API.ADMIN.REJECT_PLAN.replace(':id', id));
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to reject plan'
    );
  }
};

export const deletePlan = async (id: string): Promise<string> => {
  try {
    await api.delete(ROUTES.API.ADMIN.DELETE_PLAN.replace(':id', id));
    return id;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to delete plan'
    );
  }
};

// Specialities
export const getAllSpecialities = async (
  params: PaginationParams
): Promise<{ specialities: Speciality[]; totalPages: number }> => {
  try {
    const response = await api.get<PaginatedResponse<Speciality>>(
      ROUTES.API.ADMIN.SPECIALITIES,
      { params }
    );
    return {
      specialities: response.data.data,
      totalPages: response.data.totalPages,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to fetch specialities'
    );
  }
};

export const createSpeciality = async (name: string): Promise<Speciality> => {
  try {
    console.log('specialityname:', name);
    const response = await api.post<Speciality>(ROUTES.API.ADMIN.SPECIALITIES, {
      name,
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to create speciality'
    );
  }
};

export const updateSpeciality = async (
  id: string,
  name: string
): Promise<Speciality> => {
  try {
    const response = await api.put<Speciality>(
      ROUTES.API.ADMIN.SPECIALITY_BY_ID.replace(':id', id),
      { name }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to update speciality'
    );
  }
};

export const deleteSpeciality = async (id: string): Promise<string> => {
  try {
    await api.delete(ROUTES.API.ADMIN.SPECIALITY_BY_ID.replace(':id', id));
    return id;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to delete speciality'
    );
  }
};

// Dashboard Stats
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await api.get<DashboardStats>(
      ROUTES.API.ADMIN.DASHBOARD_STATS
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to fetch dashboard stats'
    );
  }
};

// Reports
export const getReports = async (filter: ReportFilter): Promise<ReportData> => {
  try {
    const response = await api.post<ReportData>(
      ROUTES.API.ADMIN.REPORTS,
      filter
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to fetch reports'
    );
  }
};
