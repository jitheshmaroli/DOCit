/* eslint-disable @typescript-eslint/no-explicit-any */
import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';
import { IPatientSubscriptionRepository } from '../../interfaces/repositories/IPatientSubscriptionRepository';
import { ISubscriptionPlanRepository } from '../../interfaces/repositories/ISubscriptionPlanRepository';
import { ValidationError } from '../../../utils/errors';

interface DashboardStats {
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

export class GetDashboardStatsUseCase {
  constructor(
    private subscriptionPlanRepository: ISubscriptionPlanRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository,
    private appointmentRepository: IAppointmentRepository
  ) {}

  async execute(doctorId: string): Promise<DashboardStats> {
    if (!doctorId) {
      throw new ValidationError('Doctor ID is required');
    }

    // Fetch approved plans
    const plans = await this.subscriptionPlanRepository.findApprovedByDoctor(doctorId);
    const activePlans = plans.filter((plan) => plan.status === 'approved').length;

    // Fetch patient subscriptions
    const subscriptions = await this.patientSubscriptionRepository.findActiveSubscriptions();
    const doctorSubscriptions = subscriptions.filter((sub) => {
      const plan = sub.planId as any;
      return plan.doctorId === doctorId && sub.status === 'active';
    });

    const totalSubscribers = doctorSubscriptions.length;

    // Calculate plan-wise revenue and appointment details
    const planWiseRevenue = await Promise.all(
      plans.map(async (plan) => {
        const planSubscriptions = doctorSubscriptions.filter((sub) => {
          const subPlan = sub.planId as any;
          return subPlan._id.toString() === plan._id?.toString();
        });
        const subscribers = planSubscriptions.length;
        const revenue = planSubscriptions.reduce((sum, sub) => sum + sub.price, 0);
        const appointmentsUsed = planSubscriptions.reduce((sum, sub) => sum + sub.appointmentsUsed, 0);
        const appointmentsLeft = planSubscriptions.reduce((sum, sub) => sum + sub.appointmentsLeft, 0);

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

    // Fetch appointments
    const appointments = await this.appointmentRepository.findByDoctor(doctorId);
    const appointmentsThroughPlans = appointments.filter((appt) => appt.isFreeBooking === false).length;
    const freeAppointments = appointments.filter((appt) => appt.isFreeBooking === true).length;

    // Calculate total revenue
    const totalRevenue = planWiseRevenue.reduce((sum, plan) => sum + plan.revenue, 0);

    return {
      activePlans,
      totalSubscribers,
      appointmentsThroughPlans,
      freeAppointments,
      totalRevenue,
      planWiseRevenue,
    };
  }
}
