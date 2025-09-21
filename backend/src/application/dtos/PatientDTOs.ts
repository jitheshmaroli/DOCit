import { SubscriptionPlan } from '../../core/entities/SubscriptionPlan';
import { AppointmentDTO } from './AppointmentDTOs'; // Import AppointmentDTO

export interface PatientDTO {
  _id?: string;
  email: string;
  name?: string;
  password?: string;
  phone?: string;
  age?: string;
  isSubscribed?: boolean;
  isBlocked?: boolean;
  lastSeen?: string;
  address?: string;
  pincode?: string;
  profilePicture?: string;
  profilePicturePublicId?: string;
  gender?: 'Male' | 'Female' | 'Other';
  googleId?: string;
  createdAt?: string;
  updatedAt?: string;
  subscribedPlans?: PatientSubscriptionDTO[];
}

export interface PatientSubscriptionDTO {
  _id?: string;
  patientId: string;
  planId: string;
  planDetails?: SubscriptionPlan;
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
  appointments?: AppointmentDTO[];
}

export interface PaginatedPatientResponseDTO {
  data: PatientDTO[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}
