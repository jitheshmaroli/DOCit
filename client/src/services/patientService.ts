import { AxiosError } from 'axios';
import api from './api';
import {
  BookAppointmentPayload,
  GetDoctorAvailabilityPayload,
  SubscriptionPlan,
} from '../types/authTypes';
import { DateUtils } from '../utils/DateUtils';
import { ROUTES } from '../constants/routeConstants';

interface PatientApiError {
  message: string;
  status?: number;
}

export interface Review {
  _id?: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  rating: number;
  comment: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getDoctors = async () => {
  try {
    const response = await api.get(ROUTES.API.PATIENT.VERIFIED_DOCTORS);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<PatientApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to fetch doctors'
    );
  }
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
  try {
    const response = await api.get(
      ROUTES.API.PATIENT.DOCTOR_AVAILABILITY.replace(':doctorId', doctorId),
      { params }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<PatientApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to fetch doctor availability'
    );
  }
};

export const getDoctorAvailabilityForDate = async ({
  doctorId,
  date,
}: {
  doctorId: string;
  date: string;
}) => {
  try {
    const response = await api.get(
      ROUTES.API.PATIENT.DOCTOR_AVAILABILITY.replace(':doctorId', doctorId),
      {
        params: { date: DateUtils.formatToISO(DateUtils.parseToUTC(date)) },
      }
    );
    const timeSlots =
      Array.isArray(response.data) && response.data.length > 0
        ? response.data[0].timeSlots || []
        : [];
    return timeSlots;
  } catch (error) {
    const axiosError = error as AxiosError<PatientApiError>;
    throw new Error(
      axiosError.response?.data.message ||
        'Failed to fetch doctor availability for date'
    );
  }
};

export const getPatientSubscription = async (doctorId: string) => {
  try {
    const response = await api.get(
      ROUTES.API.PATIENT.DOCTOR_SUBSCRIPTION.replace(':doctorId', doctorId)
    );
    return response.data || null;
  } catch (error) {
    const axiosError = error as AxiosError<PatientApiError>;
    throw new Error(
      axiosError.response?.data.message ||
        'Failed to fetch patient subscription'
    );
  }
};

export const getPatientAppointments = async () => {
  try {
    const response = await api.get(ROUTES.API.PATIENT.APPOINTMENTS);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<PatientApiError>;
    throw new Error(
      axiosError.response?.data.message ||
        'Failed to fetch patient appointments'
    );
  }
};

export const getPatientAppointmentsForDoctor = async (
  doctorId: string,
  page: number = 1,
  limit: number = 5
) => {
  try {
    const response = await api.get(ROUTES.API.PATIENT.APPOINTMENTS, {
      params: { doctorId, page, limit },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<PatientApiError>;
    throw new Error(
      axiosError.response?.data.message ||
        'Failed to fetch patient appointments for doctor'
    );
  }
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
  try {
    const response = await api.post(
      ROUTES.API.PATIENT.BOOK_APPOINTMENT,
      payload
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<PatientApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to book appointment'
    );
  }
};

export const getDoctorPlans = async (
  doctorId: string
): Promise<SubscriptionPlan[]> => {
  try {
    const response = await api.get(
      ROUTES.API.PATIENT.DOCTOR_PLANS.replace(':doctorId', doctorId)
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<PatientApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to fetch doctor plans'
    );
  }
};

export const subscribeToPlan = async (planId: string, price: number) => {
  try {
    const response = await api.post(ROUTES.API.PATIENT.SUBSCRIBE_TO_PLAN, {
      planId,
      price,
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<PatientApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to subscribe to plan'
    );
  }
};

export const confirmSubscription = async (
  planId: string,
  paymentIntentId: string
) => {
  try {
    const response = await api.post(ROUTES.API.PATIENT.CONFIRM_SUBSCRIPTION, {
      planId,
      paymentIntentId,
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<PatientApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to confirm subscription'
    );
  }
};

export const cancelAppointment = async (
  appointmentId: string,
  cancellationReason?: string
) => {
  try {
    const response = await api.delete(
      ROUTES.API.PATIENT.CANCEL_APPOINTMENT.replace(
        ':appointmentId',
        appointmentId
      ),
      {
        data: { cancellationReason },
      }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<PatientApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to cancel appointment'
    );
  }
};

export const createReview = async (
  appointmentId: string,
  doctorId: string,
  rating: number,
  comment: string
) => {
  try {
    const response = await api.post(ROUTES.API.PATIENT.CREATE_REVIEW, {
      appointmentId,
      doctorId,
      rating,
      comment,
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<PatientApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to create review'
    );
  }
};

export const getDoctorReviews = async (doctorId: string): Promise<Review[]> => {
  try {
    const response = await api.get(
      ROUTES.API.PATIENT.DOCTOR_REVIEWS.replace(':doctorId', doctorId)
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<PatientApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to fetch doctor reviews'
    );
  }
};
