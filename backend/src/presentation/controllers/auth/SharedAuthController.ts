import { Response, NextFunction } from 'express';
import { AuthenticationError, ValidationError } from '../../../utils/errors';
import { validatePassword } from '../../../utils/validators';
import { setTokensInCookies } from '../../../utils/cookieUtils';
import { env } from '../../../config/env';
import { CustomRequest } from '../../../types';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';
import { IAuthenticationUseCase } from '../../../core/interfaces/use-cases/IAuthenticationUseCase';

export class SharedAuthController {
  constructor(private _authenticationUseCase: IAuthenticationUseCase) {}

  async refreshToken(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshTokenData = {
        refreshToken: req.cookies.refreshToken,
      };
      if (!refreshTokenData.refreshToken) throw new AuthenticationError(ResponseMessages.INVALID_TOKEN);
      const { accessToken, refreshToken } = await this._authenticationUseCase.refreshToken(
        refreshTokenData.refreshToken
      );
      setTokensInCookies(res, accessToken, refreshToken);
      const responseData = {
        accessToken,
        refreshToken,
        message: ResponseMessages.SUCCESS,
      };
      res.status(HttpStatusCode.OK).json(responseData);
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

      const responseData = {
        message: ResponseMessages.LOGGED_OUT,
      };
      res.status(HttpStatusCode.OK).json(responseData);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const forgotPasswordData = {
        email: req.body.email,
      };
      if (!forgotPasswordData.email) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      await this._authenticationUseCase.forgotPassword(forgotPasswordData.email);
      const responseData = {
        message: ResponseMessages.OTP_SENT,
      };
      res.status(HttpStatusCode.OK).json(responseData);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const resetPasswordData = {
        email: req.body.email,
        otp: req.body.otp,
        newPassword: req.body.newPassword,
      };
      if (!resetPasswordData.email || !resetPasswordData.otp || !resetPasswordData.newPassword) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      if (!validatePassword(resetPasswordData.newPassword)) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      await this._authenticationUseCase.resetPassword(
        resetPasswordData.email,
        resetPasswordData.otp,
        resetPasswordData.newPassword
      );
      const responseData = {
        message: ResponseMessages.PASSWORD_RESET,
      };
      res.status(HttpStatusCode.OK).json(responseData);
    } catch (error) {
      next(error);
    }
  }

  async verifySignUpOTP(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const verifySignupOTPData = {
        email: req.body.email,
        otp: req.body.otp,
        _id: req.body._id,
        name: req.body.name,
        password: req.body.password,
        phone: req.body.phone,
        role: req.body.role,
        licenseNumber: req.body.licenseNumber,
      };
      if (
        !verifySignupOTPData.email ||
        !verifySignupOTPData.otp ||
        !verifySignupOTPData.role ||
        !verifySignupOTPData.name ||
        !verifySignupOTPData.password ||
        !verifySignupOTPData.phone ||
        (verifySignupOTPData.role === 'doctor' && !verifySignupOTPData.licenseNumber)
      ) {
        throw new ValidationError('Missing required fields');
      }

      const { user, accessToken, refreshToken } =
        await this._authenticationUseCase.verifySignUpOTP(verifySignupOTPData);
      if (!user) {
        throw new ValidationError(`Failed to verify ${verifySignupOTPData.role}`);
      }

      setTokensInCookies(res, accessToken, refreshToken);
      const responseDTO = {
        user,
        role: verifySignupOTPData.role,
        accessToken,
        refreshToken,
      };
      res.status(HttpStatusCode.OK).json(responseDTO);
    } catch (error) {
      next(error);
    }
  }

  async resendSignupOTP(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const resendSignupOTPData = {
        email: req.body.email,
        role: req.body.role,
      };
      if (!resendSignupOTPData.email || !resendSignupOTPData.role) {
        throw new ValidationError('Email and role are required');
      }
      await this._authenticationUseCase.resendSignupOTP(resendSignupOTPData.email, resendSignupOTPData.role);
      const responseData = {
        message: ResponseMessages.OTP_SENT,
      };
      res.status(HttpStatusCode.OK).json(responseData);
    } catch (error) {
      next(error);
    }
  }
}
