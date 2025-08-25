import { QueryParams } from '../../../types/authTypes';
import {
  CreateSubscriptionPlanRequestDTO,
  UpdateSubscriptionPlanRequestDTO,
  SubscribeToPlanRequestDTO,
  ConfirmSubscriptionRequestDTO,
  CancelSubscriptionRequestDTO,
  SubscriptionPlanResponseDTO,
  PatientSubscriptionResponseDTO,
  PaginatedSubscriptionPlanResponseDTO,
  PlanSubscriptionCountsResponseDTO,
  CancelSubscriptionResponseDTO,
} from '../SubscriptionPlanDTOs';

export interface ISubscriptionPlanUseCase {
  createSubscriptionPlan(
    doctorId: string,
    plan: CreateSubscriptionPlanRequestDTO
  ): Promise<SubscriptionPlanResponseDTO>;
  updateDoctorSubscriptionPlan(
    subscriptionPlanId: string,
    doctorId: string,
    planData: UpdateSubscriptionPlanRequestDTO
  ): Promise<SubscriptionPlanResponseDTO>;
  getDoctorSubscriptionPlans(doctorId: string, params?: QueryParams): Promise<PaginatedSubscriptionPlanResponseDTO>;
  getDoctorApprovedPlans(doctorId: string): Promise<SubscriptionPlanResponseDTO[]>;
  manageSubscriptionPlanGetAll(params: QueryParams): Promise<PaginatedSubscriptionPlanResponseDTO>;
  approveSubscriptionPlan(planId: string): Promise<SubscriptionPlanResponseDTO>;
  rejectSubscriptionPlan(planId: string): Promise<SubscriptionPlanResponseDTO>;
  deleteSubscriptionPlan(planId: string): Promise<void>;
  subscribeToPlan(
    patientId: string,
    dto: SubscribeToPlanRequestDTO
  ): Promise<{ clientSecret: string; paymentIntentId: string }>;
  confirmSubscription(patientId: string, dto: ConfirmSubscriptionRequestDTO): Promise<PatientSubscriptionResponseDTO>;
  cancelSubscription(patientId: string, dto: CancelSubscriptionRequestDTO): Promise<CancelSubscriptionResponseDTO>;
  getPatientSubscriptions(patientId: string): Promise<PatientSubscriptionResponseDTO[]>;
  getPlanSubscriptionCounts(planId: string): Promise<PlanSubscriptionCountsResponseDTO>;
}
