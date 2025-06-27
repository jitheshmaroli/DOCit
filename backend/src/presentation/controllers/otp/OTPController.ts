import { Request, Response, NextFunction } from 'express';
import { IOTPService } from '../../../core/interfaces/services/IOTPService';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';

export class OTPController {
  private otpService: IOTPService;

  constructor(container: Container) {
    this.otpService = container.get('IOTPService');
  }

  async sendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      await this.otpService.sendOTP(email);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.OTP_SENT });
    } catch (error) {
      next(error);
    }
  }

  async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const isValid = await this.otpService.verifyOTP(email, otp);
      if (!isValid) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.OTP_VERIFIED });
    } catch (error) {
      next(error);
    }
  }
}
