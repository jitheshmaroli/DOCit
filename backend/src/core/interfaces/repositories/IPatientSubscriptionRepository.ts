import { IBaseRepository } from './IBaseRepository';
import { PatientSubscription } from '../../entities/PatientSubscription';
import { ClientSession, FilterQuery } from 'mongoose';

export interface IPatientSubscriptionRepository extends IBaseRepository<PatientSubscription> {
  findActiveByPatientAndDoctor(patientId: string, doctorId: string): Promise<PatientSubscription | null>;
  findByPatient(patientId: string): Promise<PatientSubscription[]>;
  incrementAppointmentCount(subscriptionId: string): Promise<PatientSubscription | null>;
  decrementAppointmentCount(subscriptionId: string): Promise<PatientSubscription | null>;
  findByStripePaymentId(stripePaymentId: string, session?: ClientSession): Promise<PatientSubscription | null>;
  findExpiringSoon(days: number): Promise<PatientSubscription[]>;
  findAll(): Promise<PatientSubscription[]>;
  findByPlan(planId: string): Promise<PatientSubscription[]>;
  findByPatientAndPlan(patientId: string, planId: string): Promise<PatientSubscription | null>;
  findNonCancelledSubscriptions(): Promise<PatientSubscription[]>;
  findCancelledSubscriptions(): Promise<PatientSubscription[]>;
  find(query: FilterQuery<PatientSubscription>): Promise<PatientSubscription[]>;
  countActiveSubscriptions(patientId: string, session?: ClientSession): Promise<number>;
  hasActiveSubscriptions(patientId: string, session?: ClientSession): Promise<boolean>;
}
