import { PatientSubscription } from '../../entities/PatientSubscription';
import { ISubscriptionPlanRepository } from '../../interfaces/repositories/ISubscriptionPlanRepository';
import { IPatientSubscriptionRepository } from '../../interfaces/repositories/IPatientSubscriptionRepository';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import moment from 'moment';

export class SubscribeToPlanUseCase {
  constructor(
    private subscriptionPlanRepository: ISubscriptionPlanRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository
  ) {}

  async execute(
    patientId: string,
    planId: string
  ): Promise<PatientSubscription> {
    const plan = await this.subscriptionPlanRepository.findById(planId);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    if (plan.status !== 'approved') {
      throw new ValidationError('Plan is not approved');
    }

    const existing =
      await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(
        patientId,
        plan.doctorId
      );
    if (existing) {
      throw new ValidationError(
        'You are already subscribed to a plan for this doctor'
      );
    }

    const startDate = new Date();
    const endDate = moment(startDate).add(plan.duration, 'days').toDate();

    const subscription: PatientSubscription = {
      patientId,
      planId,
      startDate,
      endDate,
      status: 'active',
    };

    return this.patientSubscriptionRepository.create(subscription);
  }
}
