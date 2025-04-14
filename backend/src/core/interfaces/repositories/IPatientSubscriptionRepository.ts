import { PatientSubscription } from '../../entities/PatientSubscription';

export interface IPatientSubscriptionRepository {
  create(subscription: PatientSubscription): Promise<PatientSubscription>;
  findActiveByPatientAndDoctor(
    patientId: string,
    doctorId: string
  ): Promise<PatientSubscription | null>;
  findByPatient(patientId: string): Promise<PatientSubscription[]>;
}
