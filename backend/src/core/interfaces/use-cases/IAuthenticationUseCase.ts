import { Patient } from '../../entities/Patient';
import { Doctor } from '../../entities/Doctor';

export interface IAuthenticationUseCase {
  loginAdmin(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }>;
  loginDoctor(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }>;
  loginPatient(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }>;
  googleSignInDoctor(token: string): Promise<{ accessToken: string; refreshToken: string }>;
  googleSignInPatient(token: string): Promise<{ accessToken: string; refreshToken: string }>;
  signupDoctor(doctor: Doctor): Promise<Doctor>;
  signupPatient(patient: Patient): Promise<Patient>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(email: string, otp: string, newPassword: string): Promise<void>;
  verifySignUpOTP(
    email: string,
    otp: string,
    entity: Doctor | Patient
  ): Promise<{
    newEntity: Patient | Doctor | null;
    accessToken: string;
    refreshToken: string;
  }>;
  refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
  logout(userId: string, role: 'patient' | 'doctor' | 'admin'): Promise<void>;
  resendSignupOTP(email: string, role: 'patient' | 'doctor'): Promise<void>;
}
