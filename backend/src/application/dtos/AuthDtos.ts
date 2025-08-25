import { UserRole } from '../../types';

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  accessToken: string;
  refreshToken: string;
  message: string;
}

export interface SignupRequestDTO {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'patient' | 'doctor';
  licenseNumber?: string;
}

export interface SignupResponseDTO {
  message: string;
  _id: string;
}

export interface GoogleSignInRequestDTO {
  token: string;
}

export interface GoogleSignInResponseDTO {
  accessToken: string;
  refreshToken: string;
  message: string;
}

export interface RefreshTokenRequestDTO {
  refreshToken: string;
}

export interface RefreshTokenResponseDTO {
  accessToken: string;
  refreshToken: string;
  message: string;
}

export interface ForgotPasswordRequestDTO {
  email: string;
}

export interface ForgotPasswordResponseDTO {
  message: string;
}

export interface ResetPasswordRequestDTO {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ResetPasswordResponseDTO {
  message: string;
}

export interface VerifySignupOTPRequestDTO {
  email: string;
  otp: string;
  _id: string;
  name: string;
  password: string;
  phone: string;
  role: UserRole.Patient | UserRole.Doctor;
  licenseNumber?: string;
}

export interface VerifySignupOTPResponseDTO {
  message: string;
  user: {
    _id: string;
    email: string;
    name: string;
    role: UserRole.Patient | UserRole.Doctor;
  };
  accessToken: string;
  refreshToken: string;
}

export interface ResendSignupOTPRequestDTO {
  email: string;
  role: UserRole.Patient | UserRole.Doctor;
}

export interface ResendSignupOTPResponseDTO {
  message: string;
}

export interface LogoutResponseDTO {
  message: string;
}
