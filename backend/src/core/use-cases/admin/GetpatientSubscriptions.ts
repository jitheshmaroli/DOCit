import { PatientSubscription } from '../../entities/PatientSubscription';
import { IPatientSubscriptionRepository } from '../../interfaces/repositories/IPatientSubscriptionRepository';

export class GetPatientSubscriptionsUseCase {
  constructor(
    private patientSubscriptionRepository: IPatientSubscriptionRepository
  ) {}

  async execute(): Promise<PatientSubscription[]> {
    return this.patientSubscriptionRepository.findAll();
  }
}
