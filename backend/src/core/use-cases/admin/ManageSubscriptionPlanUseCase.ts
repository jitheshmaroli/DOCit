import { ISubscriptionPlanRepository } from '../../interfaces/repositories/ISubscriptionPlanRepository';
import { NotFoundError } from '../../../utils/errors';
import { SubscriptionPlan } from '../../entities/SubscriptionPlan';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';

export class ManageSubscriptionPlanUseCase {
  constructor(
    private subscriptionPlanRepository: ISubscriptionPlanRepository,
    private doctorRepository: IDoctorRepository
  ) {}

  async getAllPlans(): Promise<SubscriptionPlan[]> {
    const plans = await this.subscriptionPlanRepository.findAll();
    return Promise.all(
      plans.map(async (plan: SubscriptionPlan) => {
        const doctor = await this.doctorRepository.findById(plan.doctorId);
        return {
          _id: plan._id,
          doctorId: plan.doctorId,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          validityDays: plan.validityDays,
          appointmentCount: plan.appointmentCount,
          status: plan.status,
          doctorName: doctor?.name || 'N/A',
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
        };
      })
    );
  }

  async getPendingPlans(): Promise<SubscriptionPlan[]> {
    const plans = await this.subscriptionPlanRepository.findPending();
    return Promise.all(
      plans.map(async (plan: SubscriptionPlan) => {
        const doctor = await this.doctorRepository.findById(plan.doctorId);
        return {
          _id: plan._id,
          doctorId: plan.doctorId,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          validityDays: plan.validityDays,
          appointmentCount: plan.appointmentCount,
          status: plan.status,
          doctorName: doctor?.name || 'N/A',
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
        };
      })
    );
  }

  async approve(planId: string): Promise<SubscriptionPlan> {
    const plan = await this.subscriptionPlanRepository.update(planId, {
      status: 'approved',
    });
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    const doctor = await this.doctorRepository.findById(plan.doctorId);
    return {
      _id: plan._id,
      doctorId: plan.doctorId,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      validityDays: plan.validityDays,
      appointmentCount: plan.appointmentCount,
      status: plan.status,
      doctorName: doctor?.name || 'N/A',
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  async reject(planId: string): Promise<SubscriptionPlan> {
    const plan = await this.subscriptionPlanRepository.update(planId, {
      status: 'rejected',
    });
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    const doctor = await this.doctorRepository.findById(plan.doctorId);
    return {
      _id: plan._id,
      doctorId: plan.doctorId,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      validityDays: plan.validityDays,
      appointmentCount: plan.appointmentCount,
      status: plan.status,
      doctorName: doctor?.name || 'N/A',
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  async delete(planId: string): Promise<void> {
    await this.subscriptionPlanRepository.delete(planId);
  }
}
