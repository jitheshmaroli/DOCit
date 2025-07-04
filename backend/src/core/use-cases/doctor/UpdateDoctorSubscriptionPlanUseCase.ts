import { ISubscriptionPlanRepository } from '../../interfaces/repositories/ISubscriptionPlanRepository';
import { SubscriptionPlan } from '../../entities/SubscriptionPlan';
import { NotFoundError, ValidationError } from '../../../utils/errors';

export class UpdateDoctorSubscriptionPlanUseCase {
  constructor(private subscriptionPlanRepository: ISubscriptionPlanRepository) {}

  async execute(
    subscriptionPlanId: string,
    doctorId: string,
    planData: Partial<SubscriptionPlan>
  ): Promise<SubscriptionPlan> {
    const plan = await this.subscriptionPlanRepository.findById(subscriptionPlanId);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    if (plan.doctorId !== doctorId) {
      throw new ValidationError('Unauthorized to update this plan');
    }

    const updatedPlan = await this.subscriptionPlanRepository.update(subscriptionPlanId, planData);
    if (!updatedPlan) {
      throw new NotFoundError('Failed to update plan');
    }
    return updatedPlan;
  }
}
