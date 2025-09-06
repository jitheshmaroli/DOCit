export interface Experience {
  hospitalName: string;
  department: string;
  years: number;
}

export interface Prescription {
  _id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Doctor {
  _id: string;
  email: string;
  name: string;
  role: string;
  phone: string;
  licenseNumber: string;
  isVerified: boolean;
  isBlocked: boolean;
  profilePicture?: string;
  availability?: string;
  speciality?: string;
  qualifications?: string[];
  age?: string;
  gender?: string;
  averageRating?: number;
  reviewIds?: string[];
  experiences?: Experience[];
  totalExperience?: number;
  location?: string;
  allowFreeBooking?: boolean;
  licenseProof?: string;
  licenseProofPublicId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  otpSent: boolean;
  isAuthenticated: boolean;
}

export interface SignUpPayload {
  _id?: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  role: string;
  licenseNumber?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  role: string;
}

export interface VerifyOtpPayload {
  email: string;
  role: string;
  otp?: string;
  password?: string;
  name?: string;
  phone?: string;
  licenseNumber?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface Subscription {
  _id: string;
  plan: SubscriptionPlan;
  daysUntilExpiration: number;
  isExpired: boolean;
  appointmentsLeft: number;
  status: 'active' | 'inactive';
  stripePaymentId?: string;
}

export interface GetDoctorAvailabilityPayload {
  doctorId: string;
  startDate: Date;
  endDate?: Date;
}

export interface BookAppointmentPayload {
  doctorId: string;
  date: Date;
  startTime: string;
  endTime: string;
  isFreeBooking: boolean;
}

export interface AvailabilityPayload {
  startDate: Date;
  endDate?: Date;
}

export interface SetAvailabilityPayload {
  date: Date;
  timeSlots: { startTime: string; endTime: string }[];
  isRecurring?: boolean;
  recurringEndDate?: Date;
  recurringDays?: number[];
}

export interface SubscriptionPlanPayload {
  name: string;
  description: string;
  price: number;
  validityDays: number;
  appointmentCount: number;
}

export interface UpdateSubscriptionPlanPayload extends SubscriptionPlanPayload {
  id: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  _id?: string;
  isBooked: boolean;
}

export interface SlotPickerProps {
  availableDates: string[];
  patientLoading: boolean;
  selectedDate: string;
  currentTimeSlots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onDateChange: (date: string) => void;
  onSlotSelect: React.Dispatch<React.SetStateAction<TimeSlot | null>>;
}

export interface User {
  _id: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  name?: string;
  phone?: string;
  isBlocked?: boolean;
  profilePicture?: string;
}

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

export interface Speciality {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  _id: string;
  email?: string;
  name?: string;
  phone?: string;
  isSubscribed?: boolean;
  isBlocked?: boolean;
  address?: string;
  age?: string;
  gender?: string;
  pincode?: string;
  profilePicture?: string;
  profilePicturePublicId?: string;
  subscribedPlans?: PatientSubscription[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  _id: string;
  patientId: Patient;
  patientName?: string;
  doctorId: Doctor;
  doctorName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'completed' | 'pending' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  isFreeBooking?: boolean;
  cancellationReason?: string;
  prescriptionId?: string | Prescription;
  hasReview?: boolean;
  reminderSent?: boolean;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  speciality?: string;
  experience?: string;
  gender?: string;
  isBlocked?: boolean;
  isVerified?: boolean;
  isSubscribed?: boolean;
  availabilityStart?: string;
  availabilityEnd?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isBlocked?: boolean;
  isSubscribed?: boolean;
  dateFrom?: string;
  isVerified?: boolean;
  dateTo?: string;
  status?: string;
  specialty?: string;
}

export enum NotificationType {
  APPOINTMENT_BOOKED = 'appointment_booked',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  PLAN_APPROVED = 'plan_approved',
  PLAN_REJECTED = 'plan_rejected',
  PLAN_SUBSCRIBED = 'plan_subscribed',
  DOCTOR_VERIFIED = 'doctor_verified',
}

export interface AppNotification {
  _id: string;
  userId: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface PatientSubscription {
  _id: string;
  patientId: string;
  planId: SubscriptionPlan;
  planDetails?: {
    _id: string;
    name: string;
    description: string;
    doctorId: string;
    doctorName: string;
    price: number;
    validityDays: number;
    appointmentCount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
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
}

export interface UpdateSlotPayload {
  availabilityId: string;
  slotIndex: number;
  startTime: string;
  endTime: string;
  reason?: string;
}