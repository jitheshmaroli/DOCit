import { SubscriptionPlan } from '../entities/SubscriptionPlan';

export interface PatientDTO {
  _id?: string;
  email: string;
  name?: string;
  password?: string;
  phone?: string;
  age?: string;
  isSubscribed?: boolean;
  isBlocked?: boolean;
  lastSeen?: Date;
  address?: string;
  pincode?: string;
  profilePicture?: string;
  profilePicturePublicId?: string;
  gender?: 'Male' | 'Female' | 'Other';
  googleId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  subscribedPlans?: PatientSubscriptionDTO[];
}

export interface PatientSubscriptionDTO {
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

export interface PaginatedPatientResponseDTO {
  data: PatientDTO[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}
