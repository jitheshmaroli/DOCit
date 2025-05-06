import api from './api';
import {
  BookAppointmentPayload,
  GetDoctorAvailabilityPayload,
  SubscriptionPlan,
} from '../types/authTypes';
import { DateUtils } from '../utils/DateUtils';

export const getDoctors = async () => {
  const response = await api.get('/api/patients/doctors/verified');
  return response.data;
};

export const getDoctorAvailability = async ({
  doctorId,
  startDate,
  endDate,
}: GetDoctorAvailabilityPayload) => {
  const params: { startDate: string; endDate?: string } = {
    startDate: DateUtils.formatToISO(startDate),
  };
  if (endDate) params.endDate = DateUtils.formatToISO(endDate);
  const response = await api.get(
    `/api/patients/doctors/${doctorId}/availability`,
    { params }
  );
  return response.data;
};

export const getDoctorAvailabilityForDate = async ({
  doctorId,
  date,
}: {
  doctorId: string;
  date: string;
}) => {
  const response = await api.get(
    `/api/patients/doctors/${doctorId}/availability`,
    {
      params: { date: DateUtils.formatToISO(DateUtils.parseToUTC(date)) },
    }
  );
  const timeSlots =
    Array.isArray(response.data) && response.data.length > 0
      ? response.data[0].timeSlots || []
      : [];
  return timeSlots;
};

export const getPatientSubscription = async (doctorId: string) => {
  const response = await api.get(
    `/api/patients/doctors/${doctorId}/subscription`
  );
  return response.data || null;
};

export const getPatientAppointments = async () => {
  const response = await api.get('/api/patients/appointments');
  return response.data;
};

export const getPatientAppointmentsForDoctor = async (doctorId: string) => {
  const response = await api.get('/api/patients/appointments', {
    params: { doctorId },
  });
  return response.data;
};

export const bookAppointment = async ({
  doctorId,
  date,
  startTime,
  endTime,
  isFreeBooking,
}: BookAppointmentPayload) => {
  const payload = {
    doctorId,
    date: DateUtils.formatToISO(date),
    startTime,
    endTime,
    isFreeBooking,
  };
  const response = await api.post('/api/patients/appointments', payload);
  return response.data;
};

export const getDoctorPlans = async (
  doctorId: string
): Promise<SubscriptionPlan[]> => {
  const response = await api.get(`/api/patients/doctors/${doctorId}/plans`);
  return response.data;
};

export const subscribeToPlan = async (planId: string, price: number) => {
  const response = await api.post('/api/patients/subscriptions', {
    planId,
    price,
  });
  return response.data;
};

export const confirmSubscription = async (
  planId: string,
  paymentIntentId: string
) => {
  const response = await api.post('/api/patients/subscriptions/confirm', {
    planId,
    paymentIntentId,
  });
  return response.data;
};

export const cancelAppointment = async (appointmentId: string) => {
  const response = await api.delete(
    `/api/patients/appointments/${appointmentId}`
  );
  return response.data;
};
