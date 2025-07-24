import { IOTPRepository } from '../../core/interfaces/repositories/IOTPRepository';
import { IOTPService } from '../../core/interfaces/services/IOTPService';
import { IEmailService } from '../../core/interfaces/services/IEmailService';
import { generateOTP } from '../../utils/generateOTP';

export class OTPService implements IOTPService {
  constructor(
    private _otpRepository: IOTPRepository,
    private _emailService: IEmailService
  ) {}

  async sendOTP(email: string): Promise<void> {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this._otpRepository.createOTP(email, otp, expiresAt);
    await this._emailService.sendEmail(email, 'Your OTP Code', `Your OTP code is ${otp}. Valid for 10 minutes.`);
  }

  async verifyOTP(email: string, otp: string): Promise<boolean> {
    const storedOTP = await this._otpRepository.findOTPByEmail(email);
    return !!(storedOTP && storedOTP.otp === otp && storedOTP.expiresAt > new Date());
  }

  async deleteOTP(email: string): Promise<void> {
    await this._otpRepository.deleteOTP(email);
  }
}
