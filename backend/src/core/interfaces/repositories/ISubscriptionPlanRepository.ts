import { IBaseRepository } from './IBaseRepository';
import { SubscriptionPlan } from '../../entities/SubscriptionPlan';
import { QueryParams } from '../../../types/authTypes';

export interface ISubscriptionPlanRepository extends IBaseRepository<SubscriptionPlan> {
  findAllWithQuery(params: QueryParams): Promise<{ data: SubscriptionPlan[]; totalItems: number }>;
  findByDoctor(doctorId: string): Promise<SubscriptionPlan[]>;
  findApprovedByDoctor(doctorId: string): Promise<SubscriptionPlan[]>;
  findPending(): Promise<SubscriptionPlan[]>;
}
