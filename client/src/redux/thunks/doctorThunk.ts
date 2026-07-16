import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchVerifiedDoctors,
  getDoctorById,
  getAvailability,
  setAvailability,
  removeSlot,
  updateSlot,
  getAppointments,
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  completeAppointment,
  getSubscribedPatients,
  getPlanSubscriptionCounts,
  getPatientAppointments,
  cancelAppointment,
} from '../../services/doctorService';
import { getDoctorPlans, subscribeToPlan } from '../../services/patientService';
import {
  AvailabilityPayload,
  SetAvailabilityPayload,
  SubscriptionPlanPayload,
  UpdateSubscriptionPlanPayload,
  QueryParams,
  Appointment,
  UpdateSlotPayload,
} from '../../types/authTypes';
import { DateUtils } from '../../utils/DateUtils';
import { SubscriptionPlan } from '../../types/subscriptionTypes';

export const fetchVerifiedDoctorsThunk = createAsyncThunk(
  'doctors/fetchVerifiedDoctors',
  async (params: QueryParams = {}, { rejectWithValue }) => {
    try {
      return await fetchVerifiedDoctors(params);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to list doctors';
      return rejectWithValue(message);
    }
  }
);

export const fetchDoctorByIdThunk = createAsyncThunk(
  'doctors/fetchDoctorById',
  async (doctorId: string, { rejectWithValue }) => {
    try {
      return await getDoctorById(doctorId);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch doctor';
      return rejectWithValue(message);
    }
  }
);

export const getAvailabilityThunk = createAsyncThunk(
  'doctors/getAvailability',
  async (payload: AvailabilityPayload, { rejectWithValue }) => {
    try {
      return await getAvailability({
        startDate: DateUtils.parseToUTC(payload.startDate),
        endDate: payload.endDate
          ? DateUtils.parseToUTC(payload.endDate)
          : undefined,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch availability';
      return rejectWithValue(message);
    }
  }
);

export const setAvailabilityThunk = createAsyncThunk(
  'doctors/setAvailability',
  async (
    payload: SetAvailabilityPayload & {
      isRecurring?: boolean;
      recurringEndDate?: Date;
      recurringDays?: number[];
    },
    { rejectWithValue }
  ) => {
    try {
      return await setAvailability({
        date: DateUtils.parseToUTC(payload.date),
        timeSlots: payload.timeSlots,
        isRecurring: payload.isRecurring,
        recurringEndDate: payload.recurringEndDate
          ? DateUtils.parseToUTC(payload.recurringEndDate)
          : undefined,
        recurringDays: payload.recurringDays,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to set Availability';
      return rejectWithValue(message);
    }
  }
);

export const removeSlotThunk = createAsyncThunk(
  'doctors/removeSlot',
  async (
    payload: { availabilityId: string; slotId: string; reason?: string },
    { rejectWithValue }
  ) => {
    try {
      return await removeSlot(payload);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to remove a slot';
      return rejectWithValue(message);
    }
  }
);

export const updateSlotThunk = createAsyncThunk(
  'doctors/updateSlot',
  async (payload: UpdateSlotPayload, { rejectWithValue }) => {
    try {
      return await updateSlot(payload);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to update slot';
      return rejectWithValue(message);
    }
  }
);

export const getAppointmentsThunk = createAsyncThunk<
  { appointments: Appointment[]; totalItems: number },
  { page?: number; limit?: number },
  { rejectValue: string }
>(
  'doctors/getAppointments',
  async ({ page = 1, limit = 5 }, { rejectWithValue }) => {
    try {
      const response = await getAppointments(page, limit);
      return response;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch appointments';
      return rejectWithValue(message);
    }
  }
);

export const completeAppointmentThunk = createAsyncThunk<
  Appointment,
  {
    appointmentId: string;
    prescription: {
      medications: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
      }>;
      notes?: string;
    };
  },
  { rejectValue: string }
>(
  'doctors/completeAppointment',
  async ({ appointmentId, prescription }, { rejectWithValue }) => {
    try {
      const response = await completeAppointment(appointmentId, prescription);
      return response;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to complete appointment';
      return rejectWithValue(message);
    }
  }
);

export const cancelAppointmentThunk = createAsyncThunk<
  void,
  { appointmentId: string; cancellationReason?: string },
  { rejectValue: string }
>(
  'doctors/cancelAppointment',
  async ({ appointmentId, cancellationReason }, { rejectWithValue }) => {
    try {
      await cancelAppointment(appointmentId, cancellationReason);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to cance appointment';
      return rejectWithValue(message);
    }
  }
);

export const subscribeToPlanThunk = createAsyncThunk(
  'doctors/subscribeToPlan',
  async (
    { planId, price }: { planId: string; price: number },
    { rejectWithValue }
  ) => {
    try {
      return await subscribeToPlan(planId, price);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to subscribe to plan';
      return rejectWithValue(message);
    }
  }
);

export const getSubscriptionPlansThunk = createAsyncThunk<
  { data: SubscriptionPlan[]; totalItems: number },
  QueryParams,
  { rejectValue: string }
>('doctors/getSubscriptionPlans', async (params, { rejectWithValue }) => {
  try {
    const response = await getSubscriptionPlans(params);
    return response;
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to fetch all subscription plans';
    return rejectWithValue(message);
  }
});

export const fetchDoctorPlansThunk = createAsyncThunk(
  'doctors/fetchDoctorPlans',
  async (doctorId: string, { rejectWithValue }) => {
    try {
      const plans = await getDoctorPlans(doctorId);
      return { doctorId, plans };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to fetch doctor subscription plans';
      return rejectWithValue(message);
    }
  }
);

export const createSubscriptionPlanThunk = createAsyncThunk(
  'doctors/createSubscriptionPlan',
  async (plan: SubscriptionPlanPayload, { rejectWithValue }) => {
    try {
      return await createSubscriptionPlan(plan);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to create subscription plan';
      return rejectWithValue(message);
    }
  }
);

export const updateSubscriptionPlanThunk = createAsyncThunk(
  'doctors/updateSubscriptionPlan',
  async (payload: UpdateSubscriptionPlanPayload, { rejectWithValue }) => {
    try {
      return await updateSubscriptionPlan(payload);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to update subscription plan';
      return rejectWithValue(message);
    }
  }
);

export const deleteSubscriptionPlanThunk = createAsyncThunk(
  'doctors/deleteSubscriptionPlan',
  async (id: string, { rejectWithValue }) => {
    try {
      return await deleteSubscriptionPlan(id);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to delete subscription plan';
      return rejectWithValue(message);
    }
  }
);

export const getSubscribedPatientsThunk = createAsyncThunk(
  'doctors/getSubscribedPatients',
  async (_, { rejectWithValue }) => {
    try {
      return await getSubscribedPatients();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to fetch subscribed patients';
      return rejectWithValue(message);
    }
  }
);

export const getPlanSubscriptionCountsThunk = createAsyncThunk(
  'doctors/getPlanSubscriptionCounts',
  async (planId: string, { rejectWithValue }) => {
    try {
      return await getPlanSubscriptionCounts(planId);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to fetch subscritpion counts';
      return rejectWithValue(message);
    }
  }
);

export const getPatientAppointmentsThunk = createAsyncThunk<
  { appointments: Appointment[]; totalItems: number },
  { patientId: string; doctorId: string; page?: number; limit?: number },
  { rejectValue: string }
>(
  'doctors/getPatientAppointments',
  async ({ patientId, doctorId, page = 1, limit = 5 }, { rejectWithValue }) => {
    try {
      const response = await getPatientAppointments(
        patientId,
        doctorId,
        page,
        limit
      );
      return response;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to fetch patient appointments';
      return rejectWithValue(message);
    }
  }
);
