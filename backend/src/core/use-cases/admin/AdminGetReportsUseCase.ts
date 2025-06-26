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

export class AdminGetReportsUseCase {
  constructor(
    private subscriptionPlanRepository: ISubscriptionPlanRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository,
    private appointmentRepository: IAppointmentRepository
  ) {}

  async execute(filter: ReportFilter): Promise<ReportData> {
    const { type, startDate, endDate } = filter;
    const reportData: ReportData = {};

    // Validate filter
    if (!['daily', 'monthly', 'yearly'].includes(type)) {
      throw new ValidationError('Invalid report type');
    }
    if (type === 'daily' && (!startDate || !endDate)) {
      throw new ValidationError('Start and end dates are required for daily reports');
    }

    // Fetch subscriptions and appointments
    const subscriptions = await this.patientSubscriptionRepository.findActiveSubscriptions();
    const appointments = await this.appointmentRepository.findAllWithQuery({});

    if (type === 'daily') {
      const dailyData: { date: string; appointments: number; revenue: number }[] = [];
      let currentDate = moment(startDate);
      const end = moment(endDate);

      while (currentDate <= end) {
        const dateStr = currentDate.format('YYYY-MM-DD');
        const dayAppointments = appointments.data.filter((appt) => moment(appt.date).isSame(currentDate, 'day')).length;
        const dayRevenue = subscriptions
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
      const months = Array.from({ length: 12 }, (_, i) => moment().month(i).format('MMM YYYY'));

      for (const month of months) {
        const monthAppointments = appointments.data.filter(
          (appt) => moment(appt.date).format('MMM YYYY') === month
        ).length;
        const monthRevenue = subscriptions
          .filter((sub) => moment(sub.startDate).format('MMM YYYY') === month)
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
        const yearAppointments = appointments.data.filter((appt) => moment(appt.date).format('YYYY') === year).length;
        const yearRevenue = subscriptions
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
