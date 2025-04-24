import { Request, Response, NextFunction } from 'express';
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

  async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken)
        throw new AuthenticationError('No refresh token provided');
      const { accessToken, refreshToken: newRefreshToken } =
        await this.refreshTokenUseCase.execute(refreshToken);
      setTokensInCookies(res, accessToken, newRefreshToken);
      res.status(200).json({ message: 'Token refreshed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, role } = (req as any).user;
      await this.logoutUseCase.execute(id, role);
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
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) throw new ValidationError('Email is required');
      await this.forgotPasswordUseCase.execute(email);
      res.status(200).json({ message: 'OTP sent to your email' });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword)
        throw new ValidationError('Email, OTP, and new password are required');
      if (!validatePassword(newPassword))
        throw new ValidationError(
          'Password must be at least 8 characters long'
        );
      await this.resetPasswordUseCase.execute(email, otp, newPassword);
      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  }

  async verifySignUpOTP(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, otp, ...entity } = req.body;
      if (!email || !otp || !entity.phone)
        throw new ValidationError(
          'Email, OTP, and phone are required for signup verification'
        );
      if (!validateEmail(email))
        throw new ValidationError('Invalid email format');
      const { newEntity, accessToken, refreshToken } =
        await this.verifySignUpOTPUseCase.execute(email, otp, entity);
      console.log('verifying otp');
      setTokensInCookies(res, accessToken, refreshToken);
      res.status(201).json(newEntity);
    } catch (error) {
      next(error);
    }
  }
}
