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
  role: string,
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
