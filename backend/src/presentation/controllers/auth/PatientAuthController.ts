import { Request, Response, NextFunction } from 'express';
import { validateEmail, validatePassword, validatePhone } from '../../../utils/validators';
import { ValidationError } from '../../../utils/errors';
import { setTokensInCookies } from '../../../utils/cookieUtils';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';
import { IAuthenticationUseCase } from '../../../core/interfaces/use-cases/IAuthenticationUseCase';
import { UserRole } from '../../../types';

export class PatientAuthController {
  constructor(private _authenticationUseCase: IAuthenticationUseCase) {}

  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signupData = {
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
        phone: req.body.phone,
      };
      if (
        !validateEmail(signupData.email) ||
        !validatePassword(signupData.password) ||
        !validatePhone(signupData.phone)
      ) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const savedPatient = await this._authenticationUseCase.signupPatient(signupData);
      const responseData = {
        message: ResponseMessages.OTP_SENT,
        _id: savedPatient._id!,
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
      const { accessToken, refreshToken } = await this._authenticationUseCase.signIn(
        UserRole.Patient,
        'email',
        loginData
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

  async googleSignIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.body.token;
      if (!token) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const { accessToken, refreshToken } = await this._authenticationUseCase.signIn(UserRole.Patient, 'google', {
        token,
      });
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
