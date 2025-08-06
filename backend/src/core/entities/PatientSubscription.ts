import { SubscriptionPlan } from './SubscriptionPlan';

export interface PatientSubscription {
  _id?: string;
  patientId: string;
  planId: string;
  planDetails?: SubscriptionPlan;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  price: number;
  appointmentsUsed: number;
  appointmentsLeft: number;
  stripePaymentId?: string;
  remainingDays?: number;
  createdAt?: Date;
  updatedAt?: Date;
  cancellationReason?: string;
}
