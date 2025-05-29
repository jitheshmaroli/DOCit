import api from './api';
import {
  AvailabilityPayload,
  SetAvailabilityPayload,
  SubscriptionPlanPayload,
  UpdateSubscriptionPlanPayload,
  QueryParams,
} from '../types/authTypes';
import { DateUtils } from '../utils/DateUtils';

export const fetchVerifiedDoctors = async (params: QueryParams = {}) => {
  const response = await api.get('/api/patients/doctors/verified', { params });
  return response.data;
};

export const getDoctorById = async (doctorId: string) => {
  const response = await api.get(`/api/patients/doctors/${doctorId}`);
  return response.data;
};

export const getAvailability = async ({
  startDate,
  endDate,
}: AvailabilityPayload) => {
  const response = await api.get('/api/doctors/availability', {
    params: {
      startDate: DateUtils.formatToISO(startDate),
      endDate: endDate ? DateUtils.formatToISO(endDate) : undefined,
    },
  });
  return response.data;
};

export const setAvailability = async ({
  date,
  timeSlots,
}: SetAvailabilityPayload) => {
  const payload = {
    date: DateUtils.formatToISO(date),
    timeSlots,
  };
  const response = await api.post('/api/doctors/availability', payload);
  return response.data;
};

export const removeSlot = async ({
  availabilityId,
  slotIndex,
}: {
  availabilityId: string;
  slotIndex: number;
}) => {
  const response = await api.post('/api/doctors/availability/slots/remove', {
    availabilityId,
    slotIndex,
  });
  return response.data;
};

export const updateSlot = async ({
  availabilityId,
  slotIndex,
  startTime,
  endTime,
}: {
  availabilityId: string;
  slotIndex: number;
  startTime: string;
  endTime: string;
}) => {
  const response = await api.patch('/api/doctors/availability/slots', {
    availabilityId,
    slotIndex,
    startTime,
    endTime,
  });
  return response.data;
};

export const getAppointments = async (page: number = 1, limit: number = 5) => {
  const response = await api.get('/api/doctors/appointments', {
    params: { page, limit },
  });
  return response.data;
};

export const getSubscriptionPlans = async () => {
  const response = await api.get('/api/doctors/subscription-plans');
  return response.data;
};

export const createSubscriptionPlan = async (plan: SubscriptionPlanPayload) => {
  const response = await api.post('/api/doctors/subscription-plans', plan);
  return response.data;
};

export const updateSubscriptionPlan = async ({
  id,
  ...plan
}: UpdateSubscriptionPlanPayload) => {
  const response = await api.put(`/api/doctors/subscription-plans/${id}`, plan);
  return response.data;
};

export const deleteSubscriptionPlan = async (id: string) => {
  await api.delete(`/api/doctors/subscription-plans/${id}`);
  return { id };
};

export const withdrawSubscriptionPlan = async (id: string) => {
  await api.patch(`/api/doctors/subscription-plans/${id}/withdraw`, {});
  return { id };
};

export const fetchSpecialities = async () => {
  const response = await api.get('/api/doctors/specialities');
  return response.data;
};
