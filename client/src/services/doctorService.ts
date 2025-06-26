import api from './api';
import {
  AvailabilityPayload,
  SetAvailabilityPayload,
  SubscriptionPlanPayload,
  UpdateSubscriptionPlanPayload,
  QueryParams,
} from '../types/authTypes';
import { DateUtils } from '../utils/DateUtils';

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

export const fetchVerifiedDoctors = async (params: QueryParams = {}) => {
  const response = await api.get('/api/patients/doctors/verified', { params });
  return response.data;
};

export const getDoctorById = async (doctorId: string) => {
  const response = await api.get(`/api/patients/doctors/${doctorId}`);
  return response.data;
};

export const getAvailability = async ({
  startDate,
  endDate,
}: AvailabilityPayload) => {
  const response = await api.get('/api/doctors/availability', {
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
}: SetAvailabilityPayload) => {
  const payload = {
    date: DateUtils.formatToISO(date),
    timeSlots,
  };
  const response = await api.post('/api/doctors/availability', payload);
  return response.data;
};

export const removeSlot = async ({
  availabilityId,
  slotIndex,
}: {
  availabilityId: string;
  slotIndex: number;
}) => {
  const response = await api.post('/api/doctors/availability/slots/remove', {
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
  const response = await api.patch('/api/doctors/availability/slots', {
    availabilityId,
    slotIndex,
    startTime,
    endTime,
  });
  return response.data;
};

export const getAppointments = async (page: number = 1, limit: number = 5) => {
  const response = await api.get('/api/doctors/appointments', {
    params: { page, limit },
  });
  return response.data;
};

export const getPatientAppointments = async (
  patientId: string,
  doctorId: string,
  page: number = 1,
  limit: number = 5
) => {
  const response = await api.get(
    `/api/doctors/patient/${patientId}/appointments`,
    {
      params: { doctorId, page, limit },
    }
  );
  return response.data;
};

export const getSubscriptionPlans = async () => {
  const response = await api.get('/api/doctors/subscription-plans');
  return response.data;
};

export const createSubscriptionPlan = async (plan: SubscriptionPlanPayload) => {
  const response = await api.post('/api/doctors/subscription-plans', plan);
  console.log('the response:', response.data);
  console.log('the response:', response.data.message);
  return response.data;
};

export const updateSubscriptionPlan = async ({
  id,
  ...plan
}: UpdateSubscriptionPlanPayload) => {
  const response = await api.put(`/api/doctors/subscription-plans/${id}`, plan);
  return response.data;
};

export const deleteSubscriptionPlan = async (id: string) => {
  await api.delete(`/api/doctors/subscription-plans/${id}`);
  return { id };
};

export const withdrawSubscriptionPlan = async (id: string) => {
  await api.patch(`/api/doctors/subscription-plans/${id}/withdraw`, {});
  return { id };
};

export const fetchSpecialities = async () => {
  const response = await api.get('/api/doctors/specialities');
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get('/api/doctors/dashboard/stats');
  return response.data;
};

export const getReports = async (filter: {
  type: 'daily' | 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
}) => {
  const response = await api.get('/api/doctors/dashboard/reports', {
    params: filter,
  });
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
      getSubscriptionPlans(),
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

    const plans: Plan[] = plansResponse.map((plan: SubscriptionPlan) => ({
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
