export interface CreateSubscriptionPlanRequestDTO {
  name: string;
  description: string;
  price: number;
  validityDays: number;
  appointmentCount: number;
}

export interface UpdateSubscriptionPlanRequestDTO extends Partial<CreateSubscriptionPlanRequestDTO> {
  status?: 'pending' | 'approved' | 'rejected';
}

export interface SubscribeToPlanRequestDTO {
  planId: string;
  price: number;
}

export interface ConfirmSubscriptionRequestDTO {
  planId: string;
  paymentIntentId: string;
}

export interface CancelSubscriptionRequestDTO {
  subscriptionId: string;
  cancellationReason?: string;
}

export interface SubscriptionPlanResponseDTO {
  _id: string;
  doctorId: string;
  name: string;
  description: string;
  price: number;
  validityDays: number;
  appointmentCount: number;
  status: 'pending' | 'approved' | 'rejected';
  doctorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientSubscriptionResponseDTO {
  _id?: string;
  patientId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled';
  price: number;
  appointmentsUsed: number;
  appointmentsLeft: number;
  stripePaymentId?: string;
  remainingDays?: number;
  createdAt?: string;
  updatedAt?: string;
  cancellationReason?: string;
}

export interface PaginatedSubscriptionPlanResponseDTO {
  data: SubscriptionPlanResponseDTO[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

export interface PlanSubscriptionCountsResponseDTO {
  active: number;
  expired: number;
  cancelled: number;
}

export interface CancelSubscriptionResponseDTO {
  message: string;
  refundId: string;
  cardLast4?: string;
  amount: number;
}
