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
import {
  RefreshTokenRequestDTO,
  RefreshTokenResponseDTO,
  LogoutResponseDTO,
  ForgotPasswordRequestDTO,
  ForgotPasswordResponseDTO,
  ResetPasswordRequestDTO,
  ResetPasswordResponseDTO,
  VerifySignupOTPRequestDTO,
  ResendSignupOTPRequestDTO,
  ResendSignupOTPResponseDTO,
} from '../../../core/interfaces/AuthDtos';
import { AuthMapper } from '../../../core/interfaces/mappers/AuthMapper';

export class SharedAuthController {
  private _authenticationUseCase: IAuthenticationUseCase;

  constructor(container: Container) {
    this._authenticationUseCase = container.get<IAuthenticationUseCase>('IAuthenticationUseCase');
  }

  async refreshToken(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshTokenDTO: RefreshTokenRequestDTO = {
        refreshToken: req.cookies.refreshToken,
      };
      if (!refreshTokenDTO.refreshToken) throw new AuthenticationError(ResponseMessages.INVALID_TOKEN);
      const { accessToken, refreshToken } = await this._authenticationUseCase.refreshToken(
        refreshTokenDTO.refreshToken
      );
      setTokensInCookies(res, accessToken, refreshToken);
      const responseDTO: RefreshTokenResponseDTO = {
        accessToken,
        refreshToken,
        message: ResponseMessages.SUCCESS,
      };
      res.status(HttpStatusCode.OK).json(responseDTO);
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

      const responseDTO: LogoutResponseDTO = {
        message: ResponseMessages.LOGGED_OUT,
      };
      res.status(HttpStatusCode.OK).json(responseDTO);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const forgotPasswordDTO: ForgotPasswordRequestDTO = {
        email: req.body.email,
      };
      if (!forgotPasswordDTO.email) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      await this._authenticationUseCase.forgotPassword(forgotPasswordDTO.email);
      const responseDTO: ForgotPasswordResponseDTO = {
        message: ResponseMessages.OTP_SENT,
      };
      res.status(HttpStatusCode.OK).json(responseDTO);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const resetPasswordDTO: ResetPasswordRequestDTO = {
        email: req.body.email,
        otp: req.body.otp,
        newPassword: req.body.newPassword,
      };
      if (!resetPasswordDTO.email || !resetPasswordDTO.otp || !resetPasswordDTO.newPassword) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      if (!validatePassword(resetPasswordDTO.newPassword)) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      await this._authenticationUseCase.resetPassword(
        resetPasswordDTO.email,
        resetPasswordDTO.otp,
        resetPasswordDTO.newPassword
      );
      const responseDTO: ResetPasswordResponseDTO = {
        message: ResponseMessages.PASSWORD_RESET,
      };
      res.status(HttpStatusCode.OK).json(responseDTO);
    } catch (error) {
      next(error);
    }
  }

  async verifySignUpOTP(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const verifySignupOTPDTO: VerifySignupOTPRequestDTO = {
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
        !verifySignupOTPDTO.email ||
        !verifySignupOTPDTO.otp ||
        !verifySignupOTPDTO.role ||
        !verifySignupOTPDTO.name ||
        !verifySignupOTPDTO.password ||
        !verifySignupOTPDTO.phone ||
        (verifySignupOTPDTO.role === 'doctor' && !verifySignupOTPDTO.licenseNumber)
      ) {
        throw new ValidationError('Missing required fields');
      }

      const { user, accessToken, refreshToken } = await this._authenticationUseCase.verifySignUpOTP(verifySignupOTPDTO);
      if (!user) {
        throw new ValidationError(`Failed to verify ${verifySignupOTPDTO.role}`);
      }

      setTokensInCookies(res, accessToken, refreshToken);
      const responseDTO = AuthMapper.mapEntityToVerifySignupResponseDTO(
        user,
        verifySignupOTPDTO.role,
        accessToken,
        refreshToken
      );
      res.status(HttpStatusCode.OK).json(responseDTO);
    } catch (error) {
      next(error);
    }
  }

  async resendSignupOTP(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const resendSignupOTPDTO: ResendSignupOTPRequestDTO = {
        email: req.body.email,
        role: req.body.role,
      };
      if (!resendSignupOTPDTO.email || !resendSignupOTPDTO.role) {
        throw new ValidationError('Email and role are required');
      }
      await this._authenticationUseCase.resendSignupOTP(resendSignupOTPDTO.email, resendSignupOTPDTO.role);
      const responseDTO: ResendSignupOTPResponseDTO = {
        message: ResponseMessages.OTP_SENT,
      };
      res.status(HttpStatusCode.OK).json(responseDTO);
    } catch (error) {
      next(error);
    }
  }
}
