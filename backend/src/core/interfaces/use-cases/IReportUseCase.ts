import {
  AdminDashboardStatsResponseDTO,
  DoctorDashboardStatsResponseDTO,
  ReportDataResponseDTO,
  ReportFilterDTO,
} from '../ReportDTOs';

export interface DailyReportData {
  date: string;
  appointments: number;
  revenue: number;
}

export interface MonthlyReportData {
  month: string;
  appointments: number;
  revenue: number;
}

export interface YearlyReportData {
  year: string;
  appointments: number;
  revenue: number;
}

export interface ReportData {
  daily?: DailyReportData[];
  monthly?: MonthlyReportData[];
  yearly?: YearlyReportData[];
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

export interface TopSubscriber {
  patientId: string;
  patientName: string;
  subscriptionCount: number;
  totalSpent: number;
}

export interface TopPatient {
  patientId: string;
  patientName: string;
  appointmentCount: number;
}

export interface TopDoctor {
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

export interface IReportUseCase {
  getAdminReports(filter: ReportFilterDTO): Promise<ReportDataResponseDTO>;
  getDoctorReports(doctorId: string, filter: ReportFilterDTO): Promise<ReportDataResponseDTO>;
  getAdminDashboardStats(): Promise<AdminDashboardStatsResponseDTO>;
  getDoctorDashboardStats(doctorId: string): Promise<DoctorDashboardStatsResponseDTO>;
}
