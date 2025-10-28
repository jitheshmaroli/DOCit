export interface ReportFilterDTO {
  type: 'daily' | 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
}

export interface ReportDataResponseDTO {
  daily?: Array<{ date: string; appointments: number; revenue: number }>;
  monthly?: Array<{ month: string; appointments: number; revenue: number }>;
  yearly?: Array<{ year: string; appointments: number; revenue: number }>;
}

export interface AdminDashboardStatsResponseDTO {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  activePlans: number;
  totalRevenue: number;
  topSubscribers: Array<{ patientId: string; patientName: string; subscriptionCount: number; totalSpent: number }>;
  topPatients: Array<{ patientId: string; patientName: string; appointmentCount: number }>;
  topDoctors: Array<{ doctorId: string; doctorName: string; subscriberCount: number }>;
  cancelledStats: {
    count: number;
    totalRefunded: number;
  };
}

export interface DoctorDashboardStatsResponseDTO {
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
  totalPlans: number;
  cancelledStats: {
    count: number;
    totalRefunded: number;
  };
}
