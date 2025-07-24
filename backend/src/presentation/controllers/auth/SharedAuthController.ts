import { Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/di/container';
import { AuthenticationError, ValidationError } from '../../../utils/errors';
import { validatePassword } from '../../../utils/validators';
import { setTokensInCookies } from '../../../utils/cookieUtils';
import { env } from '../../../config/env';
import { CustomRequest } from '../../../types';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';
import { IAuthenticationUseCase } from '../../../core/interfaces/use-cases/IAuthenticationUseCase';

export class SharedAuthController {
  private _authenticationUseCase: IAuthenticationUseCase;

  constructor(container: Container) {
    this._authenticationUseCase = container.get<IAuthenticationUseCase>('IAuthenticationUseCase');
  }

  async refreshToken(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) throw new AuthenticationError(ResponseMessages.INVALID_TOKEN);
      const { accessToken, refreshToken: newRefreshToken } =
        await this._authenticationUseCase.refreshToken(refreshToken);
      setTokensInCookies(res, accessToken, newRefreshToken);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.SUCCESS });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      if (userId && userRole) {
        await this._authenticationUseCase.logout(userId, userRole);
      }

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
      await this._authenticationUseCase.forgotPassword(email);
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
      await this._authenticationUseCase.resetPassword(email, otp, newPassword);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.PASSWORD_RESET });
    } catch (error) {
      next(error);
    }
  }

  async verifySignUpOTP(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp, name, password, phone, role, licenseNumber } = req.body;
      if (!email || !otp || !role || !name || !password || !phone || (role === 'doctor' && !licenseNumber)) {
        throw new ValidationError('Missing required fields');
      }

      const entity = {
        email,
        name,
        password,
        phone,
        ...(role === 'doctor' && { licenseNumber, speciality: '' }),
        _id: req.body._id,
        role,
      };

      const { newEntity, accessToken, refreshToken } = await this._authenticationUseCase.verifySignUpOTP(
        email,
        otp,
        entity
      );

      if (!newEntity) {
        throw new ValidationError(`Failed to verify ${role}`);
      }

      setTokensInCookies(res, accessToken, refreshToken);
      res.status(HttpStatusCode.OK).json({
        message: ResponseMessages.OTP_VERIFIED,
        user: {
          _id: newEntity._id,
          email: newEntity.email,
          name: newEntity.name,
          role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async resendSignupOTP(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, role } = req.body;
      if (!email || !role) {
        throw new ValidationError('Email and role are required');
      }
      await this._authenticationUseCase.resendSignupOTP(email, role);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.OTP_SENT });
    } catch (error) {
      next(error);
    }
  }
}
