import { IPatientSubscriptionRepository } from '../../interfaces/repositories/IPatientSubscriptionRepository';
import { PatientSubscription } from '../../entities/PatientSubscription';

export class GetPatientActiveSubscriptionUseCase {
  constructor(private patientSubscriptionRepository: IPatientSubscriptionRepository) {}

  async execute(patientId: string, doctorId: string): Promise<PatientSubscription | null> {
    return await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, doctorId);
  }
}
