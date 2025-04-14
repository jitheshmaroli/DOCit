import { ISubscriptionPlanRepository } from '../../interfaces/repositories/ISubscriptionPlanRepository';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import { SubscriptionPlan } from '../../entities/SubscriptionPlan';

export class ManageSubscriptionPlanUseCase {
  constructor(
    private subscriptionPlanRepository: ISubscriptionPlanRepository
  ) {}

  async approve(planId: string): Promise<void> {
    const plan = await this.subscriptionPlanRepository.findById(planId);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    if (plan.status !== 'pending') {
      throw new ValidationError('Plan is not pending');
    }
    await this.subscriptionPlanRepository.update(planId, {
      status: 'approved',
    });
  }

  async reject(planId: string): Promise<void> {
    const plan = await this.subscriptionPlanRepository.findById(planId);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    if (plan.status !== 'pending') {
      throw new ValidationError('Plan is not pending');
    }
    await this.subscriptionPlanRepository.update(planId, {
      status: 'rejected',
    });
  }

  async getPendingPlans(): Promise<SubscriptionPlan[]> {
    return this.subscriptionPlanRepository.findPending();
  }
}
