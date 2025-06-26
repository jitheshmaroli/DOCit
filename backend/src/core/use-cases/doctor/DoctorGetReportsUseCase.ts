/* eslint-disable @typescript-eslint/no-explicit-any */
import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';
import { IPatientSubscriptionRepository } from '../../interfaces/repositories/IPatientSubscriptionRepository';
import { ISubscriptionPlanRepository } from '../../interfaces/repositories/ISubscriptionPlanRepository';
import { ValidationError } from '../../../utils/errors';
import moment from 'moment';

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

export class DoctorGetReportsUseCase {
  constructor(
    private subscriptionPlanRepository: ISubscriptionPlanRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository,
    private appointmentRepository: IAppointmentRepository
  ) {}

  async execute(doctorId: string, filter: ReportFilter): Promise<ReportData> {
    if (!doctorId) {
      throw new ValidationError('Doctor ID is required');
    }

    const { type, startDate, endDate } = filter;
    const reportData: ReportData = {};

    // Fetch subscriptions and appointments
    const subscriptions = await this.patientSubscriptionRepository.findActiveSubscriptions();
    const doctorSubscriptions = subscriptions.filter((sub) => {
      const plan = sub.planId as any;
      return plan.doctorId === doctorId && sub.status === 'active';
    });

    const appointments = await this.appointmentRepository.findByDoctor(doctorId);

    if (type === 'daily' && startDate && endDate) {
      const dailyData: { date: string; appointments: number; revenue: number }[] = [];
      let currentDate = moment(startDate);
      const end = moment(endDate);

      while (currentDate <= end) {
        const dateStr = currentDate.format('YYYY-MM-DD');
        const dayAppointments = appointments.filter((appt) => moment(appt.date).isSame(currentDate, 'day')).length;
        const dayRevenue = doctorSubscriptions
          .filter((sub) => moment(sub.startDate).isSame(currentDate, 'day'))
          .reduce((sum, sub) => sum + sub.price, 0);

        dailyData.push({
          date: dateStr,
          appointments: dayAppointments,
          revenue: dayRevenue,
        });
        currentDate = currentDate.add(1, 'day');
      }
      reportData.daily = dailyData;
    } else if (type === 'monthly') {
      const monthlyData: { month: string; appointments: number; revenue: number }[] = [];
      const months = Array.from({ length: 12 }, (_, i) => moment().month(i).format('MMM'));

      for (const month of months) {
        const monthAppointments = appointments.filter((appt) => moment(appt.date).format('MMM') === month).length;
        const monthRevenue = doctorSubscriptions
          .filter((sub) => moment(sub.startDate).format('MMM') === month)
          .reduce((sum, sub) => sum + sub.price, 0);

        monthlyData.push({
          month,
          appointments: monthAppointments,
          revenue: monthRevenue,
        });
      }
      reportData.monthly = monthlyData;
    } else if (type === 'yearly') {
      const yearlyData: { year: string; appointments: number; revenue: number }[] = [];
      const years = Array.from({ length: 3 }, (_, i) => moment().subtract(i, 'years').format('YYYY'));

      for (const year of years) {
        const yearAppointments = appointments.filter((appt) => moment(appt.date).format('YYYY') === year).length;
        const yearRevenue = doctorSubscriptions
          .filter((sub) => moment(sub.startDate).format('YYYY') === year)
          .reduce((sum, sub) => sum + sub.price, 0);

        yearlyData.push({
          year,
          appointments: yearAppointments,
          revenue: yearRevenue,
        });
      }
      reportData.yearly = yearlyData;
    }

    return reportData;
  }
}
