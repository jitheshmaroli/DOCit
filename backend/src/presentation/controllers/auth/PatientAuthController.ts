import { Request, Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/di/container';
import { validateEmail, validatePassword, validatePhone } from '../../../utils/validators';
import { ValidationError } from '../../../utils/errors';
import { setTokensInCookies } from '../../../utils/cookieUtils';
import { SignupPatientUseCase } from '../../../core/use-cases/auth/patient/SignupPatientUseCase';
import { LoginPatientUseCase } from '../../../core/use-cases/auth/patient/LoginPatientUseCase';
import { GoogleSignInPatientUseCase } from '../../../core/use-cases/auth/patient/GoogleSignInPatientUseCase';

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
        throw new ValidationError('Invalid input: email, password (min 8 chars), and phone are required');
      }
      await this.signupPatientUseCase.execute(patient);
      res.status(200).json({ message: 'OTP sent to your email' });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) throw new ValidationError('Email and password are required');
      const { accessToken, refreshToken } = await this.loginPatientUseCase.execute(email, password);
      setTokensInCookies(res, accessToken, refreshToken);
      console.log('cookie', res.cookie);
      res.status(200).json({ message: 'Logged in successfully' });
    } catch (error) {
      next(error);
    }
  }

  async googleSignIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      if (!token) throw new ValidationError('Google ID is required');
      const { accessToken, refreshToken } = await this.googleSignInPatientUseCase.execute(token);
      setTokensInCookies(res, accessToken, refreshToken);
      res.status(200).json({ message: 'Logged in successfully' });
    } catch (error) {
      next(error);
    }
  }
}
