import api from './api';
import {
  AvailabilityPayload,
  SetAvailabilityPayload,
  SubscriptionPlanPayload,
  UpdateSubscriptionPlanPayload,
  QueryParams,
} from '../types/authTypes';
import { DateUtils } from '../utils/DateUtils';
import { ROUTES } from '../constants/routeConstants';

// Types
interface DashboardStats {
  activePlans: number;
  totalSubscribers: number;
  appointmentsThroughPlans: number;
  freeAppointments: number;
  totalRevenue: number;
  planWiseRevenue: Array<{
    planId: string;
    planName: string;
    subscribers: number;
    revenue: number;
    appointmentsUsed: number;
    appointmentsLeft: number;
  }>;
}

interface Plan {
  id: string;
  name: string;
  subscribers: number;
  status: string;
  expired?: boolean;
}

interface ReportFilter {
  type: 'daily' | 'monthly' | 'yearly';
  startDate?: Date;
  endDate?: Date;
}

interface ReportData {
  daily?: Array<{ date: string; appointments: number; revenue: number }>;
  monthly?: Array<{ month: string; appointments: number; revenue: number }>;
  yearly?: Array<{ year: string; appointments: number; revenue: number }>;
}

interface Appointment {
  _id: string;
  patientId: { name: string };
  date: string;
  startTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface SubscriptionPlan {
  _id: string;
  name: string;
  status: string;
}

interface PlanWiseRevenue {
  planId: string;
  planName: string;
  subscribers: number;
  revenue: number;
  appointmentsUsed: number;
  appointmentsLeft: number;
}

interface DashboardData {
  stats: DashboardStats | null;
  appointments: Appointment[];
  plans: Plan[];
  reportData:
    | ReportData['daily']
    | ReportData['monthly']
    | ReportData['yearly'];
}

interface Prescription {
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  notes?: string;
}

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
}: {
  availabilityId: string;
  slotIndex: number;
}) => {
  const response = await api.post(ROUTES.API.DOCTOR.REMOVE_SLOT, {
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
  const response = await api.patch(ROUTES.API.DOCTOR.UPDATE_SLOT, {
    availabilityId,
    slotIndex,
    startTime,
    endTime,
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

export const withdrawSubscriptionPlan = async (id: string) => {
  await api.patch(
    ROUTES.API.DOCTOR.WITHDRAW_SUBSCRIPTION_PLAN.replace(':id', id),
    {}
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
}): Promise<DashboardData> => {
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

    const plans: Plan[] = plansResponse.data.map((plan: SubscriptionPlan) => ({
      id: plan._id,
      name: plan.name,
      subscribers:
        statsResponse.planWiseRevenue.find(
          (p: PlanWiseRevenue) => p.planId === plan._id
        )?.subscribers || 0,
      status: plan.status,
      expired: plan.status === 'rejected',
    }));

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
