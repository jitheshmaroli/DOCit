import { Request, Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/di/container';
import { validateEmail, validatePassword, validatePhone } from '../../../utils/validators';
import { ValidationError } from '../../../utils/errors';
import { setTokensInCookies } from '../../../utils/cookieUtils';
import { SignupPatientUseCase } from '../../../core/use-cases/auth/patient/SignupPatientUseCase';
import { LoginPatientUseCase } from '../../../core/use-cases/auth/patient/LoginPatientUseCase';
import { GoogleSignInPatientUseCase } from '../../../core/use-cases/auth/patient/GoogleSignInPatientUseCase';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';

export class PatientAuthController {
  private signupPatientUseCase: SignupPatientUseCase;
  private loginPatientUseCase: LoginPatientUseCase;
  private googleSignInPatientUseCase: GoogleSignInPatientUseCase;

  constructor(container: Container) {
    this.signupPatientUseCase = container.get('SignupPatientUseCase');
    this.loginPatientUseCase = container.get('LoginPatientUseCase');
    this.googleSignInPatientUseCase = container.get('GoogleSignInPatientUseCase');
  }

  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = req.body;
      if (!validateEmail(patient.email) || !validatePassword(patient.password) || !validatePhone(patient.phone)) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      await this.signupPatientUseCase.execute(patient);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.OTP_SENT });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const { accessToken, refreshToken } = await this.loginPatientUseCase.execute(email, password);
      setTokensInCookies(res, accessToken, refreshToken);
      console.log('cookie', res.cookie);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.LOGGED_IN });
    } catch (error) {
      next(error);
    }
  }

  async googleSignIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      if (!token) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const { accessToken, refreshToken } = await this.googleSignInPatientUseCase.execute(token);
      setTokensInCookies(res, accessToken, refreshToken);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.LOGGED_IN });
    } catch (error) {
      next(error);
    }
  }
}
