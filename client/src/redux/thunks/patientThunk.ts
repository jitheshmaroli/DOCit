import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  getDoctorAvailability,
  getDoctorAvailabilityForDate,
  getPatientSubscription,
  getPatientAppointmentsForDoctor,
  bookAppointment,
  getPatientAppointments,
  cancelAppointment,
  cancelSubscription,
  getPatientSubscriptions,
  getDoctor,
} from '../../services/patientService';
import {
  GetDoctorAvailabilityPayload,
  BookAppointmentPayload,
  Appointment,
  PatientSubscription,
} from '../../types/authTypes';
import { DateUtils } from '../../utils/DateUtils';

interface CancelSubscriptionResponse {
  refundId: string;
  cardLast4?: string;
  amount: number;
}

export const getDoctorAvailabilityThunk = createAsyncThunk(
  'patient/getDoctorAvailability',
  async (payload: GetDoctorAvailabilityPayload, { rejectWithValue }) => {
    try {
      const startDate = DateUtils.parseToUTC(payload.startDate);
      const endDate = payload.endDate
        ? DateUtils.parseToUTC(payload.endDate)
        : undefined;
      return await getDoctorAvailability({
        doctorId: payload.doctorId,
        startDate,
        endDate,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch doctor availability';
      return rejectWithValue(errorMessage);
    }
  }
);

export const getDoctorAvailabilityForDateThunk = createAsyncThunk(
  'patient/getDoctorAvailabilityForDate',
  async (
    { doctorId, date }: { doctorId: string; date: string },
    { rejectWithValue }
  ) => {
    try {
      const utcDate = DateUtils.parseToUTC(date);
      const timeSlots = await getDoctorAvailabilityForDate({
        doctorId,
        date: DateUtils.formatToISO(utcDate),
      });
      return timeSlots;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch availability for date';
      return rejectWithValue(errorMessage);
    }
  }
);

export const bookAppointmentThunk = createAsyncThunk(
  'patient/bookAppointment',
  async (payload: BookAppointmentPayload, { rejectWithValue }) => {
    try {
      const utcDate = DateUtils.parseToUTC(payload.date);
      return await bookAppointment({
        ...payload,
        date: utcDate,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to book appointment';
      return rejectWithValue(errorMessage);
    }
  }
);

export const getPatientSubscriptionThunk = createAsyncThunk(
  'patient/getPatientSubscription',
  async (doctorId: string, { rejectWithValue }) => {
    try {
      const subscription = await getPatientSubscription(doctorId);
      if (!subscription) {
        return null;
      }
      const doctor = await getDoctor(doctorId);
      return {
        _id: subscription._id,
        plan: {
          _id: subscription.planId._id,
          name: subscription.planId.name,
          description: subscription.planId.description,
          price: subscription.planId.price,
          validityDays: subscription.planId.validityDays,
          appointmentCount: subscription.planId.appointmentCount,
          doctorId: subscription.planId.doctorId,
          doctorName: doctor?.name || 'Unknown Doctor',
        },
        daysUntilExpiration: subscription.remainingDays,
        isExpired:
          subscription.status !== 'active' ||
          DateUtils.parseToUTC(subscription.expiryDate) < new Date(),
        appointmentsLeft: subscription.appointmentsLeft,
        status: subscription.status,
        createdAt: subscription.createdAt,
        expiryDate: subscription.expiryDate,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch patient subscription';
      return rejectWithValue(errorMessage);
    }
  }
);

export const getPatientSubscriptionsThunk = createAsyncThunk(
  'patient/getPatientSubscriptions',
  async (_, { rejectWithValue }) => {
    try {
      const subscriptions = await getPatientSubscriptions();
      const formattedSubscriptions = await Promise.all(
        subscriptions.map(async (subscription: PatientSubscription) => {
          if (!subscription.planId || !subscription?.planDetails?.doctorId) {
            console.warn(
              `Skipping doctor fetch for subscription ${subscription._id}: missing planId or doctorId`
            );
            return {
              _id: subscription._id,
              plan: {
                _id: subscription.planDetails?._id || '',
                name: subscription.planDetails?.name || 'Unknown Plan',
                description: subscription.planDetails?.description || '',
                price: subscription.planDetails?.price || 0,
                validityDays: subscription.planDetails?.validityDays || 0,
                appointmentCount: subscription.planDetails?.appointmentCount || 0,
                doctorId: subscription.planDetails?.doctorId || '',
              },
              daysUntilExpiration: subscription.remainingDays,
              isExpired:
                subscription.status !== 'active' ||
                DateUtils.parseToUTC(subscription.expiryDate) < new Date(),
              appointmentsLeft: subscription.appointmentsLeft,
              status: subscription.status,
              createdAt: subscription.createdAt,
              expiryDate: subscription.expiryDate,
            };
          }

          const doctor = await getDoctor(subscription.planDetails.doctorId);
          return {
            _id: subscription._id,
            plan: {
              _id: subscription.planDetails._id,
              name: subscription.planDetails.name,
              description: subscription.planDetails.description,
              price: subscription.planDetails.price,
              validityDays: subscription.planDetails.validityDays,
              appointmentCount: subscription.planDetails.appointmentCount,
              doctorId: subscription.planDetails.doctorId,
              doctorName: doctor?.name || 'Unknown Doctor',
            },
            daysUntilExpiration: subscription.remainingDays,
            isExpired:
              subscription.status !== 'active' ||
              DateUtils.parseToUTC(subscription.expiryDate) < new Date(),
            appointmentsLeft: subscription.appointmentsLeft,
            status: subscription.status,
            createdAt: subscription.createdAt,
            expiryDate: subscription.expiryDate,
          };
        })
      );
      return formattedSubscriptions;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch patient subscriptions';
      return rejectWithValue(errorMessage);
    }
  }
);

export const getPatientAppointmentsForDoctorThunk = createAsyncThunk<
  { appointments: Appointment[]; totalItems: number; canBookFree?: boolean },
  { doctorId: string; page?: number; limit?: number },
  { rejectValue: string }
>(
  'patient/getPatientAppointmentsForDoctor',
  async ({ doctorId, page = 1, limit = 5 }, { rejectWithValue }) => {
    try {
      const response = await getPatientAppointmentsForDoctor(
        doctorId,
        page,
        limit
      );
      return response;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch appointments';
      return rejectWithValue(errorMessage);
    }
  }
);

export const getPatientAppointmentsThunk = createAsyncThunk(
  'patient/getPatientAppointments',
  async (_: void, { rejectWithValue }) => {
    try {
      return await getPatientAppointments();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch patient appointments';
      return rejectWithValue(errorMessage);
    }
  }
);

export const cancelAppointmentThunk = createAsyncThunk<
  void,
  { appointmentId: string; cancellationReason?: string },
  { rejectValue: string }
>(
  'patient/cancelAppointment',
  async ({ appointmentId, cancellationReason }, { rejectWithValue }) => {
    try {
      await cancelAppointment(appointmentId, cancellationReason);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to cancel appointment';
      return rejectWithValue(errorMessage);
    }
  }
);

export const cancelSubscriptionThunk = createAsyncThunk<
  CancelSubscriptionResponse,
  { subscriptionId: string; cancellationReason?: string },
  { rejectValue: string }
>(
  'patient/cancelSubscription',
  async ({ subscriptionId, cancellationReason }, { rejectWithValue }) => {
    try {
      const response = await cancelSubscription(
        subscriptionId,
        cancellationReason
      );
      return response;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to cancel subscription';
      return rejectWithValue(errorMessage);
    }
  }
);
