/* eslint-disable @typescript-eslint/no-explicit-any */
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
  withdrawSubscriptionPlan,
  completeAppointment,
  getSubscribedPatients,
  getPlanSubscriptionCounts,
  getPatientAppointments,
  cancelAppointment,
} from '../../services/doctorService';
import {
  confirmSubscription,
  getDoctorPlans,
  subscribeToPlan,
} from '../../services/patientService';
import {
  AvailabilityPayload,
  SetAvailabilityPayload,
  SubscriptionPlanPayload,
  UpdateSubscriptionPlanPayload,
  QueryParams,
  Appointment,
  SubscriptionPlan,
  UpdateSlotPayload,
} from '../../types/authTypes';
import { DateUtils } from '../../utils/DateUtils';

export const fetchVerifiedDoctorsThunk = createAsyncThunk(
  'doctors/fetchVerifiedDoctors',
  async (params: QueryParams = {}, { rejectWithValue }) => {
    try {
      return await fetchVerifiedDoctors(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch doctors');
    }
  }
);

export const fetchDoctorByIdThunk = createAsyncThunk(
  'doctors/fetchDoctorById',
  async (doctorId: string, { rejectWithValue }) => {
    try {
      return await getDoctorById(doctorId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch doctor');
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
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch availability');
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
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to set availability');
    }
  }
);

export const removeSlotThunk = createAsyncThunk(
  'doctors/removeSlot',
  async (
    payload: { availabilityId: string; slotIndex: number; reason?: string },
    { rejectWithValue }
  ) => {
    try {
      return await removeSlot(payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove slot');
    }
  }
);

export const updateSlotThunk = createAsyncThunk(
  'doctors/updateSlot',
  async (payload: UpdateSlotPayload, { rejectWithValue }) => {
    try {
      return await updateSlot(payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update slot');
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
    } catch (error: any) {
      console.error('Error in getAppointmentsThunk:', error);
      return rejectWithValue(error.message || 'Failed to fetch appointments');
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
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to complete appointment');
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
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel appointment');
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
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        return rejectWithValue(
          'You already have an active subscription for this doctor'
        );
      }
      return rejectWithValue(error.message || 'Failed to subscribe to plan');
    }
  }
);

export const confirmSubscriptionThunk = createAsyncThunk(
  'doctors/confirmSubscription',
  async (
    { planId, paymentIntentId }: { planId: string; paymentIntentId: string },
    { rejectWithValue }
  ) => {
    try {
      return await confirmSubscription(planId, paymentIntentId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to confirm subscription');
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
  } catch (error: any) {
    return rejectWithValue(
      error.message || 'Failed to fetch subscription plans'
    );
  }
});

export const fetchDoctorPlansThunk = createAsyncThunk(
  'doctors/fetchDoctorPlans',
  async (doctorId: string, { rejectWithValue }) => {
    try {
      const plans = await getDoctorPlans(doctorId);
      return { doctorId, plans };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get doctor plan');
    }
  }
);

export const createSubscriptionPlanThunk = createAsyncThunk(
  'doctors/createSubscriptionPlan',
  async (plan: SubscriptionPlanPayload, { rejectWithValue }) => {
    try {
      return await createSubscriptionPlan(plan);
    } catch (error: any) {
      return rejectWithValue(error || 'Failed to create subscription plan');
    }
  }
);

export const updateSubscriptionPlanThunk = createAsyncThunk(
  'doctors/updateSubscriptionPlan',
  async (payload: UpdateSubscriptionPlanPayload, { rejectWithValue }) => {
    try {
      return await updateSubscriptionPlan(payload);
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to update subscription plan'
      );
    }
  }
);

export const deleteSubscriptionPlanThunk = createAsyncThunk(
  'doctors/deleteSubscriptionPlan',
  async (id: string, { rejectWithValue }) => {
    try {
      return await deleteSubscriptionPlan(id);
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to delete subscription plan'
      );
    }
  }
);

export const withdrawSubscriptionPlanThunk = createAsyncThunk(
  'doctors/withdrawSubscriptionPlan',
  async (id: string, { rejectWithValue }) => {
    try {
      return await withdrawSubscriptionPlan(id);
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to withdraw subscription plan'
      );
    }
  }
);

export const getSubscribedPatientsThunk = createAsyncThunk(
  'doctors/getSubscribedPatients',
  async (_, { rejectWithValue }) => {
    try {
      return await getSubscribedPatients();
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to fetch subscribed patients'
      );
    }
  }
);

export const getPlanSubscriptionCountsThunk = createAsyncThunk(
  'doctors/getPlanSubscriptionCounts',
  async (planId: string, { rejectWithValue }) => {
    try {
      return await getPlanSubscriptionCounts(planId);
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to fetch subscription counts'
      );
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
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to fetch patient appointments'
      );
    }
  }
);
