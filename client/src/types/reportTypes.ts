import { Appointment } from "./authTypes";


interface TopSubscriber {
  patientId: string;
  patientName: string;
  subscriptionCount: number;
  totalSpent: number;
}

interface TopPatient {
  patientId: string;
  patientName: string;
  appointmentCount: number;
}

interface TopDoctor {
  doctorId: string;
  doctorName: string;
  subscriberCount: number;
}

export interface AdminDashboardStats {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  activePlans: number;
  totalRevenue: number;
  topSubscribers: TopSubscriber[];
  topPatients: TopPatient[];
  topDoctors: TopDoctor[];
}

export interface DoctorDashboardStats {
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


export interface ReportFilter {
  type: 'daily' | 'monthly' | 'yearly';
  startDate?: Date;
  endDate?: Date;
}

export interface ReportData {
  daily?: Array<{ date: string; appointments: number; revenue: number }>;
  monthly?: Array<{ month: string; appointments: number; revenue: number }>;
  yearly?: Array<{ year: string; appointments: number; revenue: number }>;
}

export interface PlanWiseRevenue {
  planId: string;
  planName: string;
  subscribers: number;
  revenue: number;
  appointmentsUsed: number;
  appointmentsLeft: number;
}

export interface Plan {
  id: string;
  name: string;
  subscribers: number;
  status: string;
  expired?: boolean;
}

export interface DoctorDashboardData {
  stats: DoctorDashboardStats | null;

  appointments: Appointment[];
  plans: Plan[];
  reportData:
    | ReportData['daily']
    | ReportData['monthly']
    | ReportData['yearly'];
}

export interface ReportItem {
  date?: string;
  month?: string;
  year?: string;
  appointments: number;
  revenue: number;
}