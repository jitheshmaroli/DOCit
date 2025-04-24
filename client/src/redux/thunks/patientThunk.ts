/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  getDoctorAvailability,
  getDoctorAvailabilityForDate,
  getPatientSubscription,
  getPatientAppointmentsForDoctor,
  bookAppointment,
  getPatientAppointments,
} from '../../services/patientService';
import {
  GetDoctorAvailabilityPayload,
  BookAppointmentPayload,
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
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to fetch doctor availability'
      );
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
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to fetch availability for date'
      );
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
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to book appointment');
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
          appointmentCost: subscription.planId.appointmentCost,
          duration: subscription.planId.duration,
        },
        daysUntilExpiration: subscription.remainingDays,
        isExpired:
          subscription.status !== 'active' ||
          DateUtils.parseToUTC(subscription.endDate) < new Date(),
      };
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to fetch patient subscription'
      );
    }
  }
);

export const checkFreeBookingThunk = createAsyncThunk(
  'patient/checkFreeBooking',
  async (_: void, { rejectWithValue }) => {
    try {
      // Placeholder: Implement free booking check logic if needed
      return false;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check free booking');
    }
  }
);

export const getPatientAppointmentsForDoctorThunk = createAsyncThunk(
  'patient/getPatientAppointmentsForDoctor',
  async (doctorId: string, { rejectWithValue }) => {
    try {
      return await getPatientAppointmentsForDoctor(doctorId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch appointments');
    }
  }
);

export const getPatientAppointmentsThunk = createAsyncThunk(
  'patient/getPatientAppointments',
  async (_: void, { rejectWithValue }) => {
    try {
      return await getPatientAppointments();
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to fetch patient appointments'
      );
    }
  }
);
