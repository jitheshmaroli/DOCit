import { SubscriptionPlan } from '../../entities/SubscriptionPlan';
import { ISubscriptionPlanRepository } from '../../interfaces/repositories/ISubscriptionPlanRepository';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { NotFoundError, ValidationError } from '../../../utils/errors';

export class CreateSubscriptionPlanUseCase {
  constructor(
    private subscriptionPlanRepository: ISubscriptionPlanRepository,
    private doctorRepository: IDoctorRepository
  ) {}

  async execute(
    doctorId: string,
    plan: Omit<
      SubscriptionPlan,
      '_id' | 'doctorId' | 'status' | 'createdAt' | 'updatedAt'
    >
  ): Promise<SubscriptionPlan> {
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    if (plan.appointmentCost <= 0) {
      throw new ValidationError('Appointment cost must be positive');
    }
    if (plan.duration <= 0) {
      throw new ValidationError('Duration must be positive');
    }

    const subscriptionPlan: SubscriptionPlan = {
      ...plan,
      doctorId,
      status: 'pending',
    };

    return this.subscriptionPlanRepository.create(subscriptionPlan);
  }
}
