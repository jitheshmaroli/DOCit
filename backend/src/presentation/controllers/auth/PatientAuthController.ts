import { Request, Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/di/container';
import { validateEmail, validatePassword, validatePhone } from '../../../utils/validators';
import { ValidationError } from '../../../utils/errors';
import { setTokensInCookies } from '../../../utils/cookieUtils';
import { IPatientUseCase } from '../../../core/interfaces/use-cases/IPatientUseCase';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';
import { IAuthenticationUseCase } from '../../../core/interfaces/use-cases/IAuthenticationUseCase';

export class PatientAuthController {
  private authenticationUseCase: IAuthenticationUseCase;
  private patientUseCase: IPatientUseCase;

  constructor(container: Container) {
    this.authenticationUseCase = container.get<IAuthenticationUseCase>('IAuthenticationUseCase');
    this.patientUseCase = container.get<IPatientUseCase>('IPatientUseCase');
  }

  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = req.body;
      if (!validateEmail(patient.email) || !validatePassword(patient.password) || !validatePhone(patient.phone)) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const savedPatient = await this.authenticationUseCase.signupPatient(patient);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.OTP_SENT, _id: savedPatient._id });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const { accessToken, refreshToken } = await this.authenticationUseCase.loginPatient(email, password);
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
      const { accessToken, refreshToken } = await this.authenticationUseCase.googleSignInPatient(token);
      setTokensInCookies(res, accessToken, refreshToken);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.LOGGED_IN });
    } catch (error) {
      next(error);
    }
  }
}
