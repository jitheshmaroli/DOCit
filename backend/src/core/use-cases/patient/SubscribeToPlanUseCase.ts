import { ISubscriptionPlanRepository } from '../../interfaces/repositories/ISubscriptionPlanRepository';
import { IPatientSubscriptionRepository } from '../../interfaces/repositories/IPatientSubscriptionRepository';
import { IPatientRepository } from '../../interfaces/repositories/IPatientRepository';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import { StripeService } from '../../../infrastructure/services/StripeService';

export class SubscribeToPlanUseCase {
  constructor(
    private subscriptionPlanRepository: ISubscriptionPlanRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository,
    private patientRepository: IPatientRepository,
    private stripeService: StripeService
  ) {}

  async execute(
    patientId: string,
    planId: string,
    price: number
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const plan = await this.subscriptionPlanRepository.findById(planId);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    if (plan.status !== 'approved') {
      throw new ValidationError('Plan is not approved');
    }

    const existing = await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, plan.doctorId);
    if (existing) {
      throw new ValidationError('You are already subscribed to a plan for this doctor');
    }

    const clientSecret = await this.stripeService.createPaymentIntent(price * 100);
    const paymentIntentId = clientSecret.split('_secret_')[0];

    return { clientSecret, paymentIntentId };
  }
}
