import { ISubscriptionPlanRepository } from '../../interfaces/repositories/ISubscriptionPlanRepository';
import { SubscriptionPlan } from '../../entities/SubscriptionPlan';
import { NotFoundError, ValidationError } from '../../../utils/errors';

export class UpdateDoctorSubscriptionPlanUseCase {
  constructor(private subscriptionPlanRepository: ISubscriptionPlanRepository) {}

  async execute(id: string, doctorId: string, planData: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const plan = await this.subscriptionPlanRepository.findById(id);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    if (plan.doctorId !== doctorId) {
      throw new ValidationError('Unauthorized to update this plan');
    }
    const updatedPlan = await this.subscriptionPlanRepository.update(id, planData);
    if (!updatedPlan) {
      throw new NotFoundError('Failed to update plan');
    }
    return updatedPlan;
  }
}
