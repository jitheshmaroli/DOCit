import { Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/di/container';
import { AuthenticationError, ValidationError } from '../../../utils/errors';
import { validateEmail, validatePassword } from '../../../utils/validators';
import { setTokensInCookies } from '../../../utils/cookieUtils';
import { RefreshTokenUseCase } from '../../../core/use-cases/auth/shared/RefreshTokenUseCase';
import { LogoutUseCase } from '../../../core/use-cases/auth/shared/LogoutUseCase';
import { ForgotPasswordUseCase } from '../../../core/use-cases/auth/shared/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from '../../../core/use-cases/auth/shared/ResetPasswordUseCase';
import { VerifySignUpOTPUseCase } from '../../../core/use-cases/auth/shared/VerifySignUpOTPUseCase';
import { env } from '../../../config/env';
import { CustomRequest } from '../../../types';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';

export class SharedAuthController {
  private refreshTokenUseCase: RefreshTokenUseCase;
  private logoutUseCase: LogoutUseCase;
  private forgotPasswordUseCase: ForgotPasswordUseCase;
  private resetPasswordUseCase: ResetPasswordUseCase;
  private verifySignUpOTPUseCase: VerifySignUpOTPUseCase;

  constructor(container: Container) {
    this.refreshTokenUseCase = container.get('RefreshTokenUseCase');
    this.logoutUseCase = container.get('LogoutUseCase');
    this.forgotPasswordUseCase = container.get('ForgotPasswordUseCase');
    this.resetPasswordUseCase = container.get('ResetPasswordUseCase');
    this.verifySignUpOTPUseCase = container.get('VerifySignUpOTPUseCase');
  }

  async refreshToken(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) throw new AuthenticationError(ResponseMessages.INVALID_TOKEN);
      const { accessToken, refreshToken: newRefreshToken } = await this.refreshTokenUseCase.execute(refreshToken);
      setTokensInCookies(res, accessToken, newRefreshToken);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.SUCCESS });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, role } = req.user || {};
      if (id && role) {
        await this.logoutUseCase.execute(id, role);
      }

      // Clear cookies regardless of user info
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.LOGGED_OUT });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      await this.forgotPasswordUseCase.execute(email);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.OTP_SENT });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      if (!validatePassword(newPassword)) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      await this.resetPasswordUseCase.execute(email, otp, newPassword);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.PASSWORD_RESET });
    } catch (error) {
      next(error);
    }
  }

  async verifySignUpOTP(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp, ...entity } = req.body;
      if (!email || !otp || !entity.phone) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      if (!validateEmail(email)) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const { newEntity, accessToken, refreshToken } = await this.verifySignUpOTPUseCase.execute(email, otp, entity);
      setTokensInCookies(res, accessToken, refreshToken);
      res.status(HttpStatusCode.CREATED).json(newEntity);
    } catch (error) {
      next(error);
    }
  }
}
