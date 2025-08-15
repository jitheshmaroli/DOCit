import { IBaseRepository } from './IBaseRepository';
import { PatientSubscription } from '../../entities/PatientSubscription';

export interface IPatientSubscriptionRepository extends IBaseRepository<PatientSubscription> {
  findActiveByPatientAndDoctor(patientId: string, doctorId: string): Promise<PatientSubscription | null>;
  findByPatient(patientId: string): Promise<PatientSubscription[]>;
  incrementAppointmentCount(subscriptionId: string): Promise<PatientSubscription | null>;
  decrementAppointmentCount(subscriptionId: string): Promise<PatientSubscription | null>;
  findActiveSubscriptions(): Promise<PatientSubscription[]>;
  findByStripePaymentId(stripePaymentId: string): Promise<PatientSubscription | null>;
  findExpiringSoon(days: number): Promise<PatientSubscription[]>;
  findAll(): Promise<PatientSubscription[]>;
  findByPlan(planId: string): Promise<PatientSubscription[]>;
}
