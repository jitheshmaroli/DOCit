import { IOTPRepository } from '../../core/interfaces/repositories/IOTPRepository';
import { OTP } from '../../core/entities/OTP';
import { OTPModel } from '../database/models/OTPModel';

export class OTPRepository implements IOTPRepository {
  async createOTP(email: string, otp: string, expiresAt: Date): Promise<OTP> {
    const newOTP = new OTPModel({ email, otp, expiresAt });
    return newOTP.save();
  }

  async findOTPByEmail(email: string): Promise<OTP | null> {
    return OTPModel.findOne({ email }).exec();
  }

  async deleteOTP(email: string): Promise<void> {
    await OTPModel.deleteOne({ email }).exec();
  }
}
