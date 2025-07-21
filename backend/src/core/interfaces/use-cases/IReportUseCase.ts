export interface ReportData {
  daily?: Array<{ date: string; appointments: number; revenue: number }>;
  monthly?: Array<{ month: string; appointments: number; revenue: number }>;
  yearly?: Array<{ year: string; appointments: number; revenue: number }>;
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
  getAdminReports(filter: {
    type: 'daily' | 'monthly' | 'yearly';
    startDate?: Date;
    endDate?: Date;
  }): Promise<ReportData>;
  getDoctorReports(
    doctorId: string,
    filter: { type: 'daily' | 'monthly' | 'yearly'; startDate?: Date; endDate?: Date }
  ): Promise<ReportData>;
  getAdminDashboardStats(): Promise<AdminDashboardStats>;
  getDoctorDashboardStats(doctorId: string): Promise<DoctorDashboardStats>;
}
