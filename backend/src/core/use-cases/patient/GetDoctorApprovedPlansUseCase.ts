import { ISubscriptionPlanRepository } from '../../interfaces/repositories/ISubscriptionPlanRepository';
import { SubscriptionPlan } from '../../entities/SubscriptionPlan';

export class GetDoctorApprovedPlansUseCase {
  constructor(private subscriptionPlanRepository: ISubscriptionPlanRepository) {}

  async execute(doctorId: string): Promise<SubscriptionPlan[]> {
    return await this.subscriptionPlanRepository.findApprovedByDoctor(doctorId);
  }
}
