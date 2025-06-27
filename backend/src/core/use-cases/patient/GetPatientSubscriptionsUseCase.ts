import { IPatientSubscriptionRepository } from '../../interfaces/repositories/IPatientSubscriptionRepository';
import { PatientSubscription } from '../../entities/PatientSubscription';

export class GetPatientSubscriptionsUseCase {
  constructor(private patientSubscriptionRepository: IPatientSubscriptionRepository) {}

  async execute(patientId: string): Promise<PatientSubscription[]> {
    return await this.patientSubscriptionRepository.findByPatient(patientId);
  }
}
