import {
  ReportData,
  DoctorDashboardStats,
  AdminDashboardStats,
  TopSubscriber,
  TopPatient,
  TopDoctor,
} from '../../interfaces/use-cases/IReportUseCase';
import { ReportDataResponseDTO, DoctorDashboardStatsResponseDTO, AdminDashboardStatsResponseDTO } from '../ReportDTOs';

export class ReportMapper {
  static toReportDataResponseDTO(data: ReportData): ReportDataResponseDTO {
    return {
      daily: data.daily?.map((item) => ({
        date: item.date,
        appointments: item.appointments,
        revenue: item.revenue,
      })),
      monthly: data.monthly?.map((item) => ({
        month: item.month,
        appointments: item.appointments,
        revenue: item.revenue,
      })),
      yearly: data.yearly?.map((item) => ({
        year: item.year,
        appointments: item.appointments,
        revenue: item.revenue,
      })),
    };
  }

  static toDoctorDashboardStatsResponseDTO(stats: DoctorDashboardStats): DoctorDashboardStatsResponseDTO {
    return {
      activePlans: stats.activePlans,
      totalSubscribers: stats.totalSubscribers,
      appointmentsThroughPlans: stats.appointmentsThroughPlans,
      freeAppointments: stats.freeAppointments,
      totalRevenue: stats.totalRevenue,
      planWiseRevenue: stats.planWiseRevenue.map((plan) => ({
        planId: plan.planId,
        planName: plan.planName,
        subscribers: plan.subscribers,
        revenue: plan.revenue,
        appointmentsUsed: plan.appointmentsUsed,
        appointmentsLeft: plan.appointmentsLeft,
      })),
    };
  }

  static toAdminDashboardStatsResponseDTO(stats: AdminDashboardStats): AdminDashboardStatsResponseDTO {
    return {
      totalDoctors: stats.totalDoctors,
      totalPatients: stats.totalPatients,
      totalAppointments: stats.totalAppointments,
      activePlans: stats.activePlans,
      totalRevenue: stats.totalRevenue,
      topSubscribers: stats.topSubscribers.map((sub: TopSubscriber) => ({
        patientId: sub.patientId,
        patientName: sub.patientName,
        subscriptionCount: sub.subscriptionCount,
        totalSpent: sub.totalSpent,
      })),
      topPatients: stats.topPatients.map((patient: TopPatient) => ({
        patientId: patient.patientId,
        patientName: patient.patientName,
        appointmentCount: patient.appointmentCount,
      })),
      topDoctors: stats.topDoctors.map((doctor: TopDoctor) => ({
        doctorId: doctor.doctorId,
        doctorName: doctor.doctorName,
        subscriberCount: doctor.subscriberCount,
      })),
    };
  }
}
