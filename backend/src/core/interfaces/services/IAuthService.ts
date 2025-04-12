import { Patient } from '../../entities/Patient';
import { Doctor } from '../../entities/Doctor';
import { Admin } from '../../entities/Admin';

export interface IAuthService {
  getCurrentUser(
    id: string,
    role: 'patient' | 'doctor' | 'admin'
  ): Promise<Patient | Doctor | Admin | null>;

  signUpPatient(patient: Patient): Promise<Patient>;

  signUpDoctor(doctor: Doctor): Promise<Doctor>;

  verifySignUpOTP(
    email: string,
    otp: string,
    entity: Patient | Doctor
  ): Promise<Patient | Doctor | null>;

  refreshToken(refreshToken: string): Promise<{ accessToken: string }>;

  loginPatient(
    email: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string }>;

  loginDoctor(
    email: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string }>;

  loginAdmin(
    email: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string }>;

  googleSignInPatient(
    token: string
  ): Promise<{ accessToken: string; refreshToken: string }>;

  googleSignInDoctor(
    token: string
  ): Promise<{ accessToken: string; refreshToken: string }>;

  logout(id: string, role: 'patient' | 'doctor' | 'admin'): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(email: string, otp: string, newPassword: string): Promise<void>;
  verifyDoctor(doctorId: string): Promise<Doctor | null>;
  listPatients(): Promise<Patient[]>;
  listDoctors(): Promise<Doctor[]>;
  listVerifiedDoctors(): Promise<Doctor[]>;
}
