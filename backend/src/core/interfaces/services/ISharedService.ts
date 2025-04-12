import { Patient } from '../../entities/Patient';
import { Doctor } from '../../entities/Doctor';

export interface ISharedService {
  refreshToken(refreshToken: string): Promise<{ accessToken: string }>;
  logout(id: string, role: 'patient' | 'doctor' | 'admin'): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(email: string, otp: string, newPassword: string): Promise<void>;
  verifySignUpOTP(
    email: string,
    otp: string,
    entity: Patient | Doctor
  ): Promise<Patient | Doctor | null>;
}
