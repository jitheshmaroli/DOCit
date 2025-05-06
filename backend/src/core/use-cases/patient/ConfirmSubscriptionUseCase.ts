import { PatientSubscription } from '../../entities/PatientSubscription';
import { ISubscriptionPlanRepository } from '../../interfaces/repositories/ISubscriptionPlanRepository';
import { IPatientSubscriptionRepository } from '../../interfaces/repositories/IPatientSubscriptionRepository';
import { IPatientRepository } from '../../interfaces/repositories/IPatientRepository';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import moment from 'moment';
import { StripeService } from '../../../infrastructure/services/StripeService';

export class ConfirmSubscriptionUseCase {
  constructor(
    private subscriptionPlanRepository: ISubscriptionPlanRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository,
    private patientRepository: IPatientRepository,
    private stripeService: StripeService
  ) {}

  async execute(
    patientId: string,
    planId: string,
    paymentIntentId: string
  ): Promise<PatientSubscription> {
    const plan = await this.subscriptionPlanRepository.findById(planId);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    if (plan.status !== 'approved') {
      throw new ValidationError('Plan is not approved');
    }

    const existing = await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(
      patientId,
      plan.doctorId
    );
    if (existing) {
      throw new ValidationError(
        'You are already subscribed to a plan for this doctor'
      );
    }

    // Verify PaymentIntent status
    await this.stripeService.confirmPaymentIntent(paymentIntentId);

    const startDate = new Date();
    const endDate = moment(startDate).add(plan.validityDays, 'days').toDate();

    const subscription: PatientSubscription = {
      patientId,
      planId,
      startDate,
      endDate,
      status: 'active',
      price: plan.price,
      appointmentsUsed: 0,
      appointmentsLeft: plan.appointmentCount,
      stripePaymentId: paymentIntentId,
    };

    const savedSubscription = await this.patientSubscriptionRepository.create(subscription);

    const activeSubscriptions = await this.patientSubscriptionRepository.findActiveSubscriptions();
    const hasActiveSubscriptions = activeSubscriptions.some(
      (sub) => sub.patientId === patientId
    );
    await this.patientRepository.updateSubscriptionStatus(patientId, hasActiveSubscriptions);

    return savedSubscription;
  }
}