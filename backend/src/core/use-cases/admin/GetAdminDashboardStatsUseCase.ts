import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';
import { IPatientSubscriptionRepository } from '../../interfaces/repositories/IPatientSubscriptionRepository';
import { ISubscriptionPlanRepository } from '../../interfaces/repositories/ISubscriptionPlanRepository';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { IPatientRepository } from '../../interfaces/repositories/IPatientRepository';
import { PatientSubscription } from '../../entities/PatientSubscription';
import { Doctor } from '../../entities/Doctor';
import { SubscriptionPlan } from '../../entities/SubscriptionPlan';
import logger from '../../../utils/logger';

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

interface DashboardStats {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  activePlans: number;
  totalRevenue: number;
  topSubscribers: TopSubscriber[];
  topPatients: TopPatient[];
  topDoctors: TopDoctor[];
}

export class GetAdminDashboardStatsUseCase {
  constructor(
    private subscriptionPlanRepository: ISubscriptionPlanRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository,
    private appointmentRepository: IAppointmentRepository,
    private doctorRepository: IDoctorRepository,
    private patientRepository: IPatientRepository
  ) {}

  async execute(): Promise<DashboardStats> {
    // Fetch counts
    const [plans, subscriptions, appointments, doctors, patients] = await Promise.all([
      this.subscriptionPlanRepository.findAllWithQuery({}),
      this.patientSubscriptionRepository.findActiveSubscriptions(),
      this.appointmentRepository.findAllWithQuery({}),
      this.doctorRepository.findAllWithQuery({}),
      this.patientRepository.findAllWithQuery({}),
    ]);

    logger.debug('Fetched data counts:', {
      plans: plans.data.length,
      subscriptions: subscriptions.length,
      appointments: appointments.data.length,
      doctors: doctors.data.length,
      patients: doctors.data.length,
    });

    const activePlans = plans.data.filter((plan) => plan.status === 'approved').length;
    const totalRevenue = subscriptions.reduce((sum, sub) => sum + sub.price, 0);

    // Calculate top subscribers (patients with most subscriptions)
    const subscriptionCounts = subscriptions.reduce(
      (acc, sub: PatientSubscription) => {
        const patientId = sub.patientId;
        if (!patientId) {
          logger.warn(`Invalid patientId in subscription: ${sub._id || 'unknown'}`);
          return acc;
        }
        const patientIdStr = patientId.toString();
        if (!acc[patientIdStr]) {
          const patient = patients.data.find((p) => p._id && p._id.toString() === patientIdStr);
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
      {} as Record<string, { count: number; totalSpent: number; patientName: string }>
    );

    const topSubscribers: TopSubscriber[] = Object.entries(subscriptionCounts)
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
      (acc, appt) => {
        const patientId = typeof appt.patientId === 'string' ? appt.patientId : appt.patientId?._id;
        if (!patientId) {
          logger.warn(`Invalid patientId in appointment: ${appt._id || 'unknown'}`);
          return acc;
        }
        const patientIdStr = patientId.toString();
        const patientName =
          typeof appt.patientId === 'string'
            ? patients.data.find((p) => p._id && p._id.toString() === patientIdStr)?.name || 'Unknown'
            : appt.patientId?.name || 'Unknown';
        if (!acc[patientIdStr]) {
          acc[patientIdStr] = { count: 0, patientName };
        }
        acc[patientIdStr].count += 1;
        return acc;
      },
      {} as Record<string, { count: number; patientName: string }>
    );

    const topPatients: TopPatient[] = Object.entries(appointmentCounts)
      .map(([patientId, { count, patientName }]) => ({
        patientId,
        patientName,
        appointmentCount: count,
      }))
      .sort((a, b) => b.appointmentCount - a.appointmentCount)
      .slice(0, 5);

    // Calculate top doctors by subscriber count
    const doctorSubscriberCounts = subscriptions.reduce(
      (acc, sub: PatientSubscription) => {
        const planId = typeof sub.planId === 'string' ? sub.planId : sub.planId?._id?.toString();
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
        const doctorIdStr = doctorId.toString(); // Normalize to string
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
      {} as Record<string, { count: number; doctorName: string }>
    );

    const topDoctors: TopDoctor[] = Object.entries(doctorSubscriberCounts)
      .map(([doctorId, { count, doctorName }]) => ({
        doctorId,
        doctorName,
        subscriberCount: count,
      }))
      .sort((a, b) => b.subscriberCount - a.subscriberCount)
      .slice(0, 5);

    logger.debug('Processed dashboard stats:', {
      topSubscribers,
      topPatients,
      topDoctors,
    });

    return {
      totalDoctors: doctors.totalItems,
      totalPatients: patients.totalItems,
      totalAppointments: appointments.totalItems,
      activePlans,
      totalRevenue,
      topSubscribers,
      topPatients,
      topDoctors,
    };
  }
}
