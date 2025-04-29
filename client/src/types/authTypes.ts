export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor' | 'admin';
  phone?: string;
  isVerified?: boolean;
  isBlocked?: boolean;
  isSubscribed?: boolean;
  licenseNumber?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  _id: string;
  email: string;
  name: string;
  phone: string;
  isSubscribed: boolean;
  isBlocked: boolean;
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

export interface SubscriptionPlan {
  _id: string;
  doctorId?: string;
  name?: string;
  description: string;
  appointmentCost: number;
  duration: number;
  status: 'pending' | 'approved' | 'rejected';
  doctorName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  _id: string;
  patientName: string;
  doctorName?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
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
}

export interface SubscriptionPlanPayload {
  name: string;
  description: string;
  appointmentCost: number;
  duration: number;
}

export interface UpdateSubscriptionPlanPayload extends SubscriptionPlanPayload {
  id: string;
}

export interface SubscriptionPlan {
  _id: string;
  name?: string;
  description: string;
  appointmentCost: number;
  duration: number;
}

export interface Speciality {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
