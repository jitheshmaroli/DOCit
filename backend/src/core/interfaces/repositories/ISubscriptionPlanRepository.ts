import { SubscriptionPlan } from '../../entities/SubscriptionPlan';

export interface ISubscriptionPlanRepository {
  create(plan: SubscriptionPlan): Promise<SubscriptionPlan>;
  findById(id: string): Promise<SubscriptionPlan | null>;
  findByDoctor(doctorId: string): Promise<SubscriptionPlan[]>;
  findApprovedByDoctor(doctorId: string): Promise<SubscriptionPlan[]>;
  findPending(): Promise<SubscriptionPlan[]>;
  update(id: string, updates: Partial<SubscriptionPlan>): Promise<void>;
}
