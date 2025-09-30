export interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  doctorId: string;
  doctorName: string;
  price: number;
  validityDays: number;
  appointmentCount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  _id: string;
  plan: SubscriptionPlan;
  daysUntilExpiration: number;
  isExpired: boolean;
  appointmentsLeft: number;
  status: 'active' | 'inactive';
  stripePaymentId?: string;
}

export interface PatientSubscription {
  _id: string;
  patientId: string;
  planId: SubscriptionPlan;
  startDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'cancelled';
  price: number;
  appointmentsUsed: number;
  appointmentsLeft: number;
  stripePaymentId?: string;
  remainingDays?: number;
  createdAt?: string;
  updatedAt?: string;
  cancellationReason?: string;
  refundId?: string;
  refundAmount?: number;
}

export interface CancelSubscriptionResponse {
  refundId: string;
  cardLast4?: string;
  amount: number;
}

export interface PlanFormData {
  name: string;
  description: string;
  price: string;
  validityDays: string;
  appointmentCount: string;
}

export interface FormErrors {
  name?: string;
  description?: string;
  price?: string;
  validityDays?: string;
  appointmentCount?: string;
}
