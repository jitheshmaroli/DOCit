import {
  IReportUseCase,
  ReportData,
  DailyReportData,
  MonthlyReportData,
  YearlyReportData,
} from '../../core/interfaces/use-cases/IReportUseCase';
import { IAppointmentRepository } from '../../core/interfaces/repositories/IAppointmentRepository';
import { IPatientSubscriptionRepository } from '../../core/interfaces/repositories/IPatientSubscriptionRepository';
import { ISubscriptionPlanRepository } from '../../core/interfaces/repositories/ISubscriptionPlanRepository';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { IPatientRepository } from '../../core/interfaces/repositories/IPatientRepository';
import { ValidationError } from '../../utils/errors';
import { DateUtils } from '../../utils/DateUtils';
import logger from '../../utils/logger';
import {
  ReportFilterDTO,
  ReportDataResponseDTO,
  AdminDashboardStatsResponseDTO,
  DoctorDashboardStatsResponseDTO,
} from '../dtos/ReportDTOs';
import { PatientSubscription } from '../../core/entities/PatientSubscription';
import { SubscriptionPlan } from '../../core/entities/SubscriptionPlan';
import { Appointment } from '../../core/entities/Appointment';
import { Doctor } from '../../core/entities/Doctor';
import { Patient } from '../../core/entities/Patient';
import { ReportMapper } from '../mappers/ReportMapper';

export class ReportUseCase implements IReportUseCase {
  constructor(
    private _subscriptionPlanRepository: ISubscriptionPlanRepository,
    private _patientSubscriptionRepository: IPatientSubscriptionRepository,
    private _appointmentRepository: IAppointmentRepository,
    private _doctorRepository: IDoctorRepository,
    private _patientRepository: IPatientRepository
  ) {}

  async getAdminReports(filter: ReportFilterDTO): Promise<ReportDataResponseDTO> {
    if (!filter.type) {
      logger.error('Report type is required');
      throw new ValidationError('Report type is required');
    }

    const { type, startDate, endDate } = filter;
    const normalizedStartDate = startDate ? DateUtils.startOfDayUTC(new Date(startDate)) : undefined;
    const normalizedEndDate = endDate ? DateUtils.endOfDayUTC(new Date(endDate)) : undefined;

    const subscriptions = await this._patientSubscriptionRepository.findActiveSubscriptions();
    const appointments = await this._appointmentRepository.findAllWithQuery({});

    const reportData = this._generateReportData(
      type,
      subscriptions,
      appointments.data,
      normalizedStartDate,
      normalizedEndDate
    );

    return ReportMapper.toReportDataResponseDTO(reportData);
  }

  async getDoctorReports(doctorId: string, filter: ReportFilterDTO): Promise<ReportDataResponseDTO> {
    if (!doctorId) {
      logger.error('Doctor ID is required for doctor reports');
      throw new ValidationError('Doctor ID is required');
    }

    if (!filter.type) {
      logger.error('Report type is required');
      throw new ValidationError('Report type is required');
    }

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      logger.error(`Doctor not found: ${doctorId}`);
      throw new ValidationError('Doctor not found');
    }

    const { type, startDate, endDate } = filter;
    const normalizedStartDate = startDate ? DateUtils.startOfDayUTC(new Date(startDate)) : undefined;
    const normalizedEndDate = endDate ? DateUtils.endOfDayUTC(new Date(endDate)) : undefined;

    const subscriptions = await this._patientSubscriptionRepository.findActiveSubscriptions();
    const doctorSubscriptions = await Promise.all(
      subscriptions.map(async (sub) => {
        const planId = typeof sub.planId === 'string' ? sub.planId : sub.planId;
        if (!planId) return null;
        const plan = await this._subscriptionPlanRepository.findById(planId);
        return plan?.doctorId === doctorId ? sub : null;
      })
    ).then((results) => results.filter((sub): sub is PatientSubscription => sub !== null));

    const appointments = await this._appointmentRepository.findByDoctor(doctorId);

    const reportData = this._generateReportData(
      type,
      doctorSubscriptions,
      appointments,
      normalizedStartDate,
      normalizedEndDate
    );

    return ReportMapper.toReportDataResponseDTO(reportData);
  }

  async getAdminDashboardStats(): Promise<AdminDashboardStatsResponseDTO> {
    const [plans, subscriptions, appointments, doctors, patients] = await Promise.all([
      this._subscriptionPlanRepository.findAllWithQuery({}),
      this._patientSubscriptionRepository.findActiveSubscriptions(),
      this._appointmentRepository.findAllWithQuery({}),
      this._doctorRepository.findAllWithQuery({}),
      this._patientRepository.findAllWithQuery({}),
    ]);

    logger.debug('Fetched data counts:', {
      plans: plans.data.length,
      subscriptions: subscriptions.length,
      appointments: appointments.data.length,
      doctors: doctors.data.length,
      patients: patients.data.length,
    });

    const activePlans = plans.data.filter((plan: SubscriptionPlan) => plan.status === 'approved').length;
    const totalRevenue = subscriptions.reduce((sum: number, sub: PatientSubscription) => sum + sub.price, 0);

    // Calculate top subscribers
    const subscriptionCounts = subscriptions.reduce(
      (acc: Record<string, { count: number; totalSpent: number; patientName: string }>, sub: PatientSubscription) => {
        const patientId = sub.patientId;
        if (!patientId) {
          logger.warn(`Invalid patientId in subscription: ${sub._id || 'unknown'}`);
          return acc;
        }
        const patientIdStr = patientId.toString();
        if (!acc[patientIdStr]) {
          const patient = patients.data.find((p: Patient) => p._id && p._id.toString() === patientIdStr);
          acc[patientIdStr] = {
            count: 0,
            totalSpent: 0,
            patientName: patient?.name || 'Unknown',
          };
          if (!patient) {
            logger.warn(`Patient not found for patientId: ${patientIdStr}`);
          }
        }
        acc[patientIdStr].count += 1;
        acc[patientIdStr].totalSpent += sub.price;
        return acc;
      },
      {}
    );

    const topSubscribers = Object.entries(subscriptionCounts)
      .map(([patientId, { count, totalSpent, patientName }]) => ({
        patientId,
        patientName,
        subscriptionCount: count,
        totalSpent,
      }))
      .sort((a, b) => b.subscriptionCount - a.subscriptionCount || b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // Calculate top patients by appointment count
    const appointmentCounts = appointments.data.reduce(
      (acc: Record<string, { count: number; patientName: string }>, appt: Appointment) => {
        const patientId = typeof appt.patientId === 'string' ? appt.patientId : appt.patientId?._id?.toString();
        if (!patientId) {
          logger.warn(`Invalid patientId in appointment: ${appt._id || 'unknown'}`);
          return acc;
        }
        const patientIdStr = patientId.toString();
        const patientName =
          typeof appt.patientId === 'string'
            ? patients.data.find((p: Patient) => p._id && p._id.toString() === patientIdStr)?.name || 'Unknown'
            : appt.patientName || 'Unknown';
        if (!acc[patientIdStr]) {
          acc[patientIdStr] = { count: 0, patientName };
        }
        acc[patientIdStr].count += 1;
        return acc;
      },
      {}
    );

    const topPatients = Object.entries(appointmentCounts)
      .map(([patientId, { count, patientName }]) => ({
        patientId,
        patientName,
        appointmentCount: count,
      }))
      .sort((a, b) => b.appointmentCount - a.appointmentCount)
      .slice(0, 5);

    // Calculate top doctors by subscriber count
    const doctorSubscriberCounts = subscriptions.reduce(
      (acc: Record<string, { count: number; doctorName: string }>, sub: PatientSubscription) => {
        const planId = typeof sub.planId === 'string' ? sub.planId : sub.planId;
        if (!planId) {
          logger.warn(`Invalid planId in subscription: ${sub._id || 'unknown'}`);
          return acc;
        }
        const plan = plans.data.find((p: SubscriptionPlan) => p._id && p._id.toString() === planId);
        if (!plan) {
          logger.warn(`Plan not found for planId: ${planId}`);
          return acc;
        }
        const doctorId = plan.doctorId;
        if (!doctorId) {
          logger.warn(`Invalid doctorId in plan: ${plan._id || 'unknown'}`);
          return acc;
        }
        const doctorIdStr = doctorId.toString();
        if (!acc[doctorIdStr]) {
          const doctor = doctors.data.find((d: Doctor) => d._id && d._id.toString() === doctorIdStr);
          acc[doctorIdStr] = {
            count: 0,
            doctorName: doctor?.name || 'Unknown',
          };
          if (!doctor) {
            logger.warn(`Doctor not found for doctorId: ${doctorIdStr}`);
          }
        }
        acc[doctorIdStr].count += 1;
        return acc;
      },
      {}
    );

    const topDoctors = Object.entries(doctorSubscriberCounts)
      .map(([doctorId, { count, doctorName }]) => ({
        doctorId,
        doctorName,
        subscriberCount: count,
      }))
      .sort((a, b) => b.subscriberCount - a.subscriberCount)
      .slice(0, 5);

    logger.debug('Processed admin dashboard stats:', {
      topSubscribers,
      topPatients,
      topDoctors,
    });

    const stats = {
      totalDoctors: doctors.totalItems,
      totalPatients: patients.totalItems,
      totalAppointments: appointments.totalItems,
      activePlans,
      totalRevenue,
      topSubscribers,
      topPatients,
      topDoctors,
    };

    return ReportMapper.toAdminDashboardStatsResponseDTO(stats);
  }

  async getDoctorDashboardStats(doctorId: string): Promise<DoctorDashboardStatsResponseDTO> {
    if (!doctorId) {
      logger.error('Doctor ID is required for dashboard stats');
      throw new ValidationError('Doctor ID is required');
    }

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      logger.error(`Doctor not found: ${doctorId}`);
      throw new ValidationError('Doctor not found');
    }

    const plans = await this._subscriptionPlanRepository.findApprovedByDoctor(doctorId);
    const activePlans = plans.filter((plan) => plan.status === 'approved').length;

    const subscriptions = await this._patientSubscriptionRepository.findActiveSubscriptions();
    const doctorSubscriptions = subscriptions.filter((sub) => {
      const planId = typeof sub.planId === 'string' ? sub.planId : sub.planId;
      const plan = plans.find((p) => p._id?.toString() === planId);
      return plan?.doctorId === doctorId && sub.status === 'active';
    });

    const totalSubscribers = doctorSubscriptions.length;

    const planWiseRevenue = await Promise.all(
      plans.map(async (plan) => {
        const planSubscriptions = doctorSubscriptions.filter((sub) => {
          const planId = typeof sub.planId === 'string' ? sub.planId : sub.planId;
          return planId === plan._id?.toString();
        });
        const subscribers = planSubscriptions.length;
        const revenue = planSubscriptions.reduce((sum: number, sub: PatientSubscription) => sum + sub.price, 0);
        const appointmentsUsed = planSubscriptions.reduce(
          (sum: number, sub: PatientSubscription) => sum + sub.appointmentsUsed,
          0
        );
        const appointmentsLeft = planSubscriptions.reduce(
          (sum: number, sub: PatientSubscription) => sum + sub.appointmentsLeft,
          0
        );

        return {
          planId: plan._id!,
          planName: plan.name,
          subscribers,
          revenue,
          appointmentsUsed,
          appointmentsLeft,
        };
      })
    );

    const appointments = await this._appointmentRepository.findByDoctor(doctorId);
    const appointmentsThroughPlans = appointments.filter((appt: Appointment) => appt.isFreeBooking === false).length;
    const freeAppointments = appointments.filter((appt: Appointment) => appt.isFreeBooking === true).length;

    const totalRevenue = planWiseRevenue.reduce((sum, plan) => sum + plan.revenue, 0);

    const stats = {
      activePlans,
      totalSubscribers,
      appointmentsThroughPlans,
      freeAppointments,
      totalRevenue,
      planWiseRevenue,
    };

    return ReportMapper.toDoctorDashboardStatsResponseDTO(stats);
  }

  private _generateReportData(
    type: 'daily' | 'monthly' | 'yearly',
    subscriptions: PatientSubscription[],
    appointments: Appointment[],
    startDate?: Date,
    endDate?: Date
  ): ReportData {
    if (type === 'daily') {
      return { daily: this._aggregateDailyData(subscriptions, appointments, startDate, endDate) };
    } else if (type === 'monthly') {
      return { monthly: this._aggregateMonthlyData(subscriptions, appointments, startDate, endDate) };
    } else {
      return { yearly: this._aggregateYearlyData(subscriptions, appointments, startDate, endDate) };
    }
  }

  private _aggregateDailyData(
    subscriptions: PatientSubscription[],
    appointments: Appointment[],
    startDate?: Date,
    endDate?: Date
  ): DailyReportData[] {
    const dailyMap: Record<string, { appointments: number; revenue: number }> = {};

    subscriptions.forEach((sub) => {
      const date = DateUtils.startOfDayUTC(sub.createdAt!).toISOString().split('T')[0];
      if (!dailyMap[date]) {
        dailyMap[date] = { appointments: 0, revenue: 0 };
      }
      dailyMap[date].revenue += sub.price;
    });

    appointments.forEach((appt) => {
      const date = DateUtils.startOfDayUTC(appt.date).toISOString().split('T')[0];
      if (!dailyMap[date]) {
        dailyMap[date] = { appointments: 0, revenue: 0 };
      }
      dailyMap[date].appointments += 1;
    });

    const dailyData = Object.entries(dailyMap).map(([date, { appointments, revenue }]) => ({
      date,
      appointments,
      revenue,
    }));

    if (startDate && endDate) {
      return dailyData.filter((data) => new Date(data.date) >= startDate && new Date(data.date) <= endDate);
    }

    return dailyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private _aggregateMonthlyData(
    subscriptions: PatientSubscription[],
    appointments: Appointment[],
    startDate?: Date,
    endDate?: Date
  ): MonthlyReportData[] {
    const monthlyMap: Record<string, { appointments: number; revenue: number }> = {};

    subscriptions.forEach((sub) => {
      const month = DateUtils.startOfMonthUTC(sub.createdAt!).toISOString().slice(0, 7);
      if (!monthlyMap[month]) {
        monthlyMap[month] = { appointments: 0, revenue: 0 };
      }
      monthlyMap[month].revenue += sub.price;
    });

    appointments.forEach((appt) => {
      const month = DateUtils.startOfMonthUTC(appt.date).toISOString().slice(0, 7);
      if (!monthlyMap[month]) {
        monthlyMap[month] = { appointments: 0, revenue: 0 };
      }
      monthlyMap[month].appointments += 1;
    });

    const monthlyData = Object.entries(monthlyMap).map(([month, { appointments, revenue }]) => ({
      month,
      appointments,
      revenue,
    }));

    if (startDate && endDate) {
      return monthlyData.filter(
        (data) =>
          new Date(data.month) >= DateUtils.startOfMonthUTC(startDate) &&
          new Date(data.month) <= DateUtils.startOfMonthUTC(endDate)
      );
    }

    return monthlyData.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }

  private _aggregateYearlyData(
    subscriptions: PatientSubscription[],
    appointments: Appointment[],
    startDate?: Date,
    endDate?: Date
  ): YearlyReportData[] {
    const yearlyMap: Record<string, { appointments: number; revenue: number }> = {};

    subscriptions.forEach((sub) => {
      const year = DateUtils.startOfYearUTC(sub.createdAt!).toISOString().slice(0, 4);
      if (!yearlyMap[year]) {
        yearlyMap[year] = { appointments: 0, revenue: 0 };
      }
      yearlyMap[year].revenue += sub.price;
    });

    appointments.forEach((appt) => {
      const year = DateUtils.startOfYearUTC(appt.date).toISOString().slice(0, 4);
      if (!yearlyMap[year]) {
        yearlyMap[year] = { appointments: 0, revenue: 0 };
      }
      yearlyMap[year].appointments += 1;
    });

    const yearlyData = Object.entries(yearlyMap).map(([year, { appointments, revenue }]) => ({
      year,
      appointments,
      revenue,
    }));

    if (startDate && endDate) {
      return yearlyData.filter(
        (data) => parseInt(data.year) >= startDate.getFullYear() && parseInt(data.year) <= endDate.getFullYear()
      );
    }

    return yearlyData.sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }
}
