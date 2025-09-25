import { Request, Response, NextFunction } from 'express';
import { IOTPService } from '../../../core/interfaces/services/IOTPService';
import { ValidationError } from '../../../utils/errors';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';

export class OTPController {
  constructor(private _otpService: IOTPService) {}

  async sendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      await this._otpService.sendOTP(email);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.OTP_SENT });
    } catch (error) {
      next(error);
    }
  }

  async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const isValid = await this._otpService.verifyOTP(email, otp);
      if (!isValid) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.OTP_VERIFIED });
    } catch (error) {
      next(error);
    }
  }
}
