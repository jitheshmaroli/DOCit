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
    plan: Omit<SubscriptionPlan, '_id' | 'doctorId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<SubscriptionPlan> {
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    if (plan.price < 100) {
      throw new ValidationError('Plan price must be at least ₹1');
    }
    if (plan.validityDays < 1) {
      throw new ValidationError('Validity days must be at least 1');
    }
    if (plan.appointmentCount < 1) {
      throw new ValidationError('Appointment count must be at least 1');
    }

    const subscriptionPlan: SubscriptionPlan = {
      ...plan,
      doctorId,
      status: 'pending',
    };

    return this.subscriptionPlanRepository.create(subscriptionPlan);
  }
}
