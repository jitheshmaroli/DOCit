import { OTP } from '../../entities/OTP';

export interface IOTPRepository {
  createOTP(email: string, otp: string, expiresAt: Date): Promise<OTP>;
  findOTPByEmail(email: string): Promise<OTP | null>;
  deleteOTP(email: string): Promise<void>;
}
