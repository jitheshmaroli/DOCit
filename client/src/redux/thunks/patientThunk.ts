import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  getDoctorAvailability,
  getDoctorAvailabilityForDate,
  getPatientSubscription,
  getPatientAppointmentsForDoctor,
  bookAppointment,
  getPatientAppointments,
  cancelAppointment,
} from '../../services/patientService';
import {
  GetDoctorAvailabilityPayload,
  BookAppointmentPayload,
  Appointment,
} from '../../types/authTypes';
import { DateUtils } from '../../utils/DateUtils';

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
      return {
        _id: subscription._id,
        plan: {
          _id: subscription.planId._id,
          name: subscription.planId.name,
          description: subscription.planId.description,
          price: subscription.planId.price,
          validityDays: subscription.planId.validityDays,
          appointmentCount: subscription.planId.appointmentCount,
        },
        daysUntilExpiration: subscription.remainingDays,
        isExpired:
          subscription.status !== 'active' ||
          DateUtils.parseToUTC(subscription.endDate) < new Date(),
        appointmentsLeft: subscription.appointmentsLeft,
        status: subscription.status,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch appointments'
      );
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
  { appointmentId: string; cancellationReason?: string }, // Updated to include cancellationReason
  { rejectValue: string }
>(
  'patient/cancelAppointment',
  async ({ appointmentId, cancellationReason }, { rejectWithValue }) => {
    try {
      await cancelAppointment(appointmentId, cancellationReason);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel appointment');
    }
  }
);
