import { Request, Response, NextFunction } from 'express';
import { IOTPService } from '../../../core/interfaces/services/IOTPService';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';

export class OTPController {
  private otpService: IOTPService;

  constructor(container: Container) {
    this.otpService = container.get('IOTPService');
  }

  async sendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) throw new ValidationError('Email is required');
      await this.otpService.sendOTP(email);
      res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
      next(error);
    }
  }

  async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) throw new ValidationError('Email and OTP are required');
      const isValid = await this.otpService.verifyOTP(email, otp);
      if (!isValid) throw new ValidationError('Invalid or expired OTP');
      res.status(200).json({ message: 'OTP verified successfully' });
    } catch (error) {
      next(error);
    }
  }
}
