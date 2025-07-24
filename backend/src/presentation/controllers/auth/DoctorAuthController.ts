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
      const doctor = req.body;
      if (
        !validateEmail(doctor.email) ||
        !validatePassword(doctor.password) ||
        !validatePhone(doctor.phone) ||
        !doctor.licenseNumber
      ) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const savedDoctor = await this._authenticationUseCase.signupDoctor(doctor);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.OTP_SENT, _id: savedDoctor._id });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const { accessToken, refreshToken } = await this._authenticationUseCase.loginDoctor(email, password);
      setTokensInCookies(res, accessToken, refreshToken);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.LOGGED_IN });
    } catch (error) {
      next(error);
    }
  }

  async googleSignIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      if (!token) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const { accessToken, refreshToken } = await this._authenticationUseCase.googleSignInDoctor(token);
      setTokensInCookies(res, accessToken, refreshToken);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.LOGGED_IN });
    } catch (error) {
      next(error);
    }
  }
}
