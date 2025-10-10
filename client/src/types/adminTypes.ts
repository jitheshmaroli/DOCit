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

export interface DashboardStats {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  activePlans: number;
  totalRevenue: number;
  topSubscribers: TopSubscriber[];
  topPatients: TopPatient[];
  topDoctors: TopDoctor[];
}

export interface ReportFilter {
  type: 'daily' | 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
}

export interface ReportItem {
  date?: string;
  month?: string;
  year?: string;
  appointments: number;
  revenue: number;
}