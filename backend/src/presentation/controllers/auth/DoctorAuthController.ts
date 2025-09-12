import { Request, Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/di/container';
import { validateEmail, validatePassword, validatePhone } from '../../../utils/validators';
import { ValidationError } from '../../../utils/errors';
import { setTokensInCookies } from '../../../utils/cookieUtils';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';
import { IAuthenticationUseCase } from '../../../core/interfaces/use-cases/IAuthenticationUseCase';

export class DoctorAuthController {
  private _authenticationUseCase: IAuthenticationUseCase;

  constructor(container: Container) {
    this._authenticationUseCase = container.get<IAuthenticationUseCase>('IAuthenticationUseCase');
  }

  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signupData = {
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
        phone: req.body.phone,
        licenseNumber: req.body.licenseNumber,
      };
      if (
        !validateEmail(signupData.email) ||
        !validatePassword(signupData.password) ||
        !validatePhone(signupData.phone) ||
        !signupData.licenseNumber
      ) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const savedDoctor = await this._authenticationUseCase.signupDoctor(signupData);
      const responseData = {
        message: ResponseMessages.OTP_SENT,
        _id: savedDoctor._id!,
      };
      res.status(HttpStatusCode.OK).json(responseData);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginData = {
        email: req.body.email,
        password: req.body.password,
      };
      if (!loginData.email || !loginData.password) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const { accessToken, refreshToken } = await this._authenticationUseCase.loginDoctor(loginData);
      setTokensInCookies(res, accessToken, refreshToken);
      const responseData = {
        accessToken,
        refreshToken,
        message: ResponseMessages.LOGGED_IN,
      };
      res.status(HttpStatusCode.OK).json(responseData);
    } catch (error) {
      next(error);
    }
  }

  async googleSignIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const googleSignInData = {
        token: req.body.token,
      };
      if (!googleSignInData.token) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const { accessToken, refreshToken } = await this._authenticationUseCase.googleSignInDoctor(
        googleSignInData.token
      );
      setTokensInCookies(res, accessToken, refreshToken);
      const responseData = {
        accessToken,
        refreshToken,
        message: ResponseMessages.LOGGED_IN,
      };
      res.status(HttpStatusCode.OK).json(responseData);
    } catch (error) {
      next(error);
    }
  }
}
