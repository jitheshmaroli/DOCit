import api from './api';
import { Doctor, Patient, Appointment, SubscriptionPlan, Speciality } from '../types/authTypes';

export const listDoctors = async (): Promise<Doctor[]> => {
  const response = await api.get('/api/admin/doctors');
  return response.data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createDoctor = async (doctor: any) => {
  const response = await api.post('/api/admin/doctors', doctor);
  return response.data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateDoctor = async (id: string, updates: any) => {
  const response = await api.patch(`/api/admin/doctors/${id}`, updates);
  return response.data;
};

export const deleteDoctor = async (id: string) => {
  await api.delete(`/api/admin/doctors/${id}`);
  return id;
};

export const blockDoctor = async (id: string, isBlocked: boolean) => {
  const response = await api.patch(`/api/admin/doctors/${id}/block`, {
    isBlocked,
  });
  return response.data;
};

export const verifyDoctor = async (doctorId: string): Promise<Doctor> => {
  const response = await api.patch(`/api/admin/verify-doctor/${doctorId}`);
  return response.data;
};

export const listPatients = async (): Promise<Patient[]> => {
  const response = await api.get('/api/admin/patients');
  return response.data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createPatient = async (patient: any) => {
  const response = await api.post('/api/admin/patients', patient);
  return response.data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updatePatient = async (id: string, updates: any) => {
  const response = await api.patch(`/api/admin/patients/${id}`, updates);
  return response.data;
};

export const deletePatient = async (id: string) => {
  await api.delete(`/api/admin/patients/${id}`);
  return id;
};

export const blockPatient = async (id: string, isBlocked: boolean) => {
  const response = await api.patch(`/api/admin/patients/${id}/block`, {
    isBlocked,
  });
  return response.data;
};

export const getAllAppointments = async (): Promise<Appointment[]> => {
  const response = await api.get('/api/admin/appointments');
  return response.data.data || [];
};

export const cancelAppointment = async (appointmentId: string) => {
  await api.put(`/api/admin/appointments/${appointmentId}/cancel`, {});
  return appointmentId;
};

export const getAllPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await api.get('/api/admin/subscription-plans');
  return response.data.data || [];
};

export const approvePlan = async (planId: string) => {
  await api.put(`/api/admin/subscription-plans/${planId}/approve`, {});
};

export const rejectPlan = async (planId: string) => {
  await api.put(`/api/admin/subscription-plans/${planId}/reject`, {});
};

export const deletePlan = async (planId: string) => {
  await api.delete(`/api/admin/subscription-plans/${planId}`);
  return planId;
};

export const getAllSpecialities = async (): Promise<Speciality[]> => {
  const response = await api.get('/api/admin/specialities');
  return response.data || [];
};

export const createSpeciality = async (name: string): Promise<Speciality> => {
  const response = await api.post('/api/admin/specialities', { name });
  return response.data;
};

export const updateSpeciality = async (id: string, name: string): Promise<Speciality> => {
  const response = await api.patch(`/api/admin/specialities/${id}`, { name });
  return response.data;
};

export const deleteSpeciality = async (specialityId: string): Promise<string> => {
  await api.delete(`/api/admin/specialities/${specialityId}`);
  return specialityId;
};