import api from './api';
import {
  AvailabilityPayload,
  SetAvailabilityPayload,
  SubscriptionPlanPayload,
  UpdateSubscriptionPlanPayload,
  QueryParams,
  Prescription,
} from '../types/authTypes';
import { DateUtils } from '../utils/DateUtils';
import { ROUTES } from '../constants/routeConstants';
import {
  DoctorDashboardData,
  Plan,
  PlanWiseRevenue,
  ReportFilter,
} from '../types/reportTypes';

export const fetchVerifiedDoctors = async (params: QueryParams = {}) => {
  const response = await api.get(ROUTES.API.PATIENT.VERIFIED_DOCTORS, {
    params,
  });
  return response.data;
};

export const getDoctorById = async (doctorId: string) => {
  const response = await api.get(
    ROUTES.API.PATIENT.DOCTOR_BY_ID.replace(':doctorId', doctorId)
  );
  return response.data;
};

export const getAvailability = async ({
  startDate,
  endDate,
}: AvailabilityPayload) => {
  const response = await api.get(ROUTES.API.DOCTOR.AVAILABILITY, {
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
  isRecurring,
  recurringEndDate,
  recurringDays,
}: SetAvailabilityPayload & {
  isRecurring?: boolean;
  recurringEndDate?: Date;
  recurringDays?: number[];
}) => {
  const payload = {
    date: DateUtils.formatToISO(date),
    timeSlots,
    isRecurring,
    recurringEndDate: recurringEndDate
      ? DateUtils.formatToISO(recurringEndDate)
      : undefined,
    recurringDays,
  };
  const response = await api.post(ROUTES.API.DOCTOR.AVAILABILITY, payload);
  return response.data;
};

export const removeSlot = async ({
  availabilityId,
  slotIndex,
  reason,
}: {
  availabilityId: string;
  slotIndex: number;
  reason?: string;
}) => {
  const response = await api.post(ROUTES.API.DOCTOR.REMOVE_SLOT, {
    availabilityId,
    slotIndex,
    reason,
  });
  return response.data;
};

export const updateSlot = async ({
  availabilityId,
  slotIndex,
  startTime,
  endTime,
  reason,
}: {
  availabilityId: string;
  slotIndex: number;
  startTime: string;
  endTime: string;
  reason?: string;
}) => {
  const response = await api.patch(ROUTES.API.DOCTOR.UPDATE_SLOT, {
    availabilityId,
    slotIndex,
    startTime,
    endTime,
    reason,
  });
  return response.data;
};

export const getAppointments = async (page: number = 1, limit: number = 5) => {
  const response = await api.get(ROUTES.API.DOCTOR.APPOINTMENTS, {
    params: { page, limit },
  });
  return response.data;
};

export const getAppointmentById = async (appointmentId: string) => {
  const response = await api.get(
    ROUTES.API.DOCTOR.APPOINTMENT_BY_ID.replace(':appointmentId', appointmentId)
  );
  return response.data;
};

export const getPatientAppointments = async (
  patientId: string,
  doctorId: string,
  page: number = 1,
  limit: number = 5
) => {
  const response = await api.get(
    ROUTES.API.DOCTOR.PATIENT_APPOINTMENTS.replace(':patientId', patientId),
    {
      params: { doctorId, page, limit },
    }
  );
  return response.data;
};

export const completeAppointment = async (
  appointmentId: string,
  prescription: Prescription
) => {
  const response = await api.post(ROUTES.API.DOCTOR.COMPLETE_APPOINTMENT, {
    appointmentId,
    prescription,
  });
  return response.data;
};

export const cancelAppointment = async (
  appointmentId: string,
  cancellationReason?: string
) => {
  const response = await api.post(ROUTES.API.DOCTOR.CANCEL_APPOINTMENT, {
    appointmentId,
    cancellationReason,
  });
  return response.data;
};

export const getSubscriptionPlans = async (params: QueryParams = {}) => {
  const response = await api.get(ROUTES.API.DOCTOR.SUBSCRIPTION_PLANS, {
    params,
  });
  return response.data;
};

export const createSubscriptionPlan = async (plan: SubscriptionPlanPayload) => {
  const response = await api.post(ROUTES.API.DOCTOR.SUBSCRIPTION_PLANS, plan);
  return response.data;
};

export const updateSubscriptionPlan = async ({
  id,
  ...plan
}: UpdateSubscriptionPlanPayload) => {
  const response = await api.put(
    ROUTES.API.DOCTOR.SUBSCRIPTION_PLAN_BY_ID.replace(':id', id),
    plan
  );
  return response.data;
};

export const deleteSubscriptionPlan = async (id: string) => {
  await api.delete(
    ROUTES.API.DOCTOR.SUBSCRIPTION_PLAN_BY_ID.replace(':id', id)
  );
  return { id };
};

export const fetchSpecialities = async () => {
  const response = await api.get(ROUTES.API.DOCTOR.SPECIALITIES);
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get(ROUTES.API.DOCTOR.DASHBOARD_STATS);
  return response.data;
};

export const getReports = async (filter: {
  type: 'daily' | 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
}) => {
  const response = await api.get(ROUTES.API.DOCTOR.REPORTS, {
    params: filter,
  });
  return response.data;
};

export const getSubscribedPatients = async () => {
  const response = await api.get(ROUTES.API.DOCTOR.SUBSCRIBED_PATIENTS);
  return response.data;
};

export const getAppointedPatients = async (page: number, limit: number) => {
  const response = await api.get(ROUTES.API.DOCTOR.APPOINTED_PATIENTS, {
    params: { page, limit },
  });
  return response.data;
};

export const getPlanSubscriptionCounts = async (planId: string) => {
  const response = await api.get(
    ROUTES.API.DOCTOR.SUBSCRIPTION_PLAN_COUNTS.replace(':planId', planId)
  );
  return response.data;
};

export const fetchDashboardData = async ({
  reportFilter,
  page = 1,
  limit = 10,
}: {
  reportFilter: ReportFilter;
  page?: number;
  limit?: number;
}): Promise<DoctorDashboardData> => {
  try {
    const [
      statsResponse,
      appointmentsResponse,
      plansResponse,
      reportsResponse,
    ] = await Promise.all([
      getDashboardStats(),
      getAppointments(page, limit),
      getSubscriptionPlans({ page, limit }),
      getReports({
        type: reportFilter.type,
        startDate: reportFilter.startDate
          ? reportFilter.startDate.toISOString()
          : undefined,
        endDate: reportFilter.endDate
          ? reportFilter.endDate.toISOString()
          : undefined,
      }),
    ]);

    const plans: Plan[] = plansResponse.data.map(
      (plan: Plan) => ({
        id: plan.id,
        name: plan.name,
        subscribers:
          statsResponse.planWiseRevenue.find(
            (p: PlanWiseRevenue) => p.planId === plan.id
          )?.subscribers || 0,
        status: plan.status,
        expired: plan.status === 'rejected',
      })
    );

    return {
      stats: statsResponse,
      appointments: appointmentsResponse.appointments,
      plans,
      reportData:
        reportFilter.type === 'daily'
          ? reportsResponse.daily
          : reportFilter.type === 'yearly'
            ? reportsResponse.yearly
            : reportsResponse.monthly,
    };
  } catch {
    throw new Error('Failed to fetch dashboard data');
  }
};
