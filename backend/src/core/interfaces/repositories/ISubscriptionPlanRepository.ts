import { QueryParams } from '../../../types/authTypes';
import { SubscriptionPlan } from '../../entities/SubscriptionPlan';

export interface ISubscriptionPlanRepository {
  create(plan: SubscriptionPlan): Promise<SubscriptionPlan>;
  findById(id: string): Promise<SubscriptionPlan | null>;
  findAllWithQuery(params: QueryParams): Promise<{ data: SubscriptionPlan[]; totalItems: number }>;
  findByDoctor(doctorId: string): Promise<SubscriptionPlan[]>;
  findApprovedByDoctor(doctorId: string): Promise<SubscriptionPlan[]>;
  findPending(): Promise<SubscriptionPlan[]>;
  update(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | null>;
  delete(id: string): Promise<void>;
}
