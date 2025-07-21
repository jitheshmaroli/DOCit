import { SubscriptionPlan } from '../../entities/SubscriptionPlan';
import { PatientSubscription } from '../../entities/PatientSubscription';
import { QueryParams } from '../../../types/authTypes';

export interface ISubscriptionPlanUseCase {
  createSubscriptionPlan(
    doctorId: string,
    plan: Omit<SubscriptionPlan, '_id' | 'doctorId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<SubscriptionPlan>;
  updateDoctorSubscriptionPlan(
    subscriptionPlanId: string,
    doctorId: string,
    planData: Partial<SubscriptionPlan>
  ): Promise<SubscriptionPlan>;
  getDoctorSubscriptionPlans(doctorId: string): Promise<SubscriptionPlan[]>;
  getDoctorApprovedPlans(doctorId: string): Promise<SubscriptionPlan[]>;
  manageSubscriptionPlanGetAll(params: QueryParams): Promise<{ data: SubscriptionPlan[]; totalItems: number }>;
  approveSubscriptionPlan(planId: string): Promise<SubscriptionPlan>;
  rejectSubscriptionPlan(planId: string): Promise<SubscriptionPlan>;
  deleteSubscriptionPlan(planId: string): Promise<void>;
  subscribeToPlan(
    patientId: string,
    planId: string,
    price: number
  ): Promise<{ clientSecret: string; paymentIntentId: string }>;
  confirmSubscription(patientId: string, planId: string, paymentIntentId: string): Promise<PatientSubscription>;
}
