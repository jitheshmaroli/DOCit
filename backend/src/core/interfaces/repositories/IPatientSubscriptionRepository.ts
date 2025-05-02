import { PatientSubscription } from '../../entities/PatientSubscription';

export interface IPatientSubscriptionRepository {
  create(subscription: PatientSubscription): Promise<PatientSubscription>;
  findActiveByPatientAndDoctor(
    patientId: string,
    doctorId: string
  ): Promise<PatientSubscription | null>;
  findByPatient(patientId: string): Promise<PatientSubscription[]>;
  findById(id: string): Promise<PatientSubscription | null>;
  incrementAppointmentCount(subscriptionId: string): Promise<PatientSubscription | null>;
  decrementAppointmentCount(subscriptionId: string): Promise<PatientSubscription | null>;
  findActiveSubscriptions(): Promise<PatientSubscription[]>;
  findByStripePaymentId(stripePaymentId: string): Promise<PatientSubscription | null>;
  update(
    id: string,
    updates: Partial<PatientSubscription>
  ): Promise<PatientSubscription | null>;
  findExpiringSoon(days: number): Promise<PatientSubscription[]>;
  findAll(): Promise<PatientSubscription[]>;
}
