import api from './api';
import {
  BookAppointmentPayload,
  GetDoctorAvailabilityPayload,
  SubscriptionPlan,
} from '../types/authTypes';
import { DateUtils } from '../utils/DateUtils';

export interface Review {
  _id?: string;
  patientId: string | { _id: string; name?: string };
  doctorId: string | { _id: string; name?: string };
  appointmentId: string;
  rating: number;
  comment: string;
  createdAt?: string;
  updatedAt?: string;
}

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
  console.log('params:', params);
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

export const getPatientAppointmentsForDoctor = async (
  doctorId: string,
  page: number = 1,
  limit: number = 5
) => {
  const response = await api.get('/api/patients/appointments', {
    params: { doctorId, page, limit },
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

export const cancelAppointment = async (
  appointmentId: string,
  cancellationReason?: string
) => {
  const response = await api.delete(
    `/api/patients/appointments/${appointmentId}`,
    {
      data: { cancellationReason },
    }
  );
  return response.data;
};

export const createReview = async (
  appointmentId: string,
  doctorId: string,
  rating: number,
  comment: string
) => {
  const response = await api.post('/api/patients/review', {
    appointmentId,
    doctorId,
    rating,
    comment,
  });
  return response.data;
};

export const getDoctorReviews = async (doctorId: string): Promise<Review[]> => {
  const response = await api.get(`/api/patients/doctors/${doctorId}/reviews`);
  return response.data;
};
