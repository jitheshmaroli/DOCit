import { Request, Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/di/container';
import { validateEmail, validatePassword, validatePhone } from '../../../utils/validators';
import { ValidationError } from '../../../utils/errors';
import { setTokensInCookies } from '../../../utils/cookieUtils';
import { SignupDoctorUseCase } from '../../../core/use-cases/auth/doctor/SignupDoctorUseCase';
import { LoginDoctorUseCase } from '../../../core/use-cases/auth/doctor/LoginDoctorUseCase';
import { GoogleSignInDoctorUseCase } from '../../../core/use-cases/auth/doctor/GoogleSignInDoctorUseCase';

export class DoctorAuthController {
  private signupDoctorUseCase: SignupDoctorUseCase;
  private loginDoctorUseCase: LoginDoctorUseCase;
  private googleSignInDoctorUseCase: GoogleSignInDoctorUseCase;

  constructor(container: Container) {
    this.signupDoctorUseCase = container.get('SignupDoctorUseCase');
    this.loginDoctorUseCase = container.get('LoginDoctorUseCase');
    this.googleSignInDoctorUseCase = container.get('GoogleSignInDoctorUseCase');
  }

  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctor = req.body;
      console.log(doctor);
      if (
        !validateEmail(doctor.email) ||
        !validatePassword(doctor.password) ||
        !validatePhone(doctor.phone) ||
        !doctor.licenseNumber
      ) {
        throw new ValidationError('Invalid input: email, password, phone, and licenseNumber are required');
      }
      await this.signupDoctorUseCase.execute(doctor);
      res.status(200).json({ message: 'OTP sent to your email' });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) throw new ValidationError('Email and password are required');
      const { accessToken, refreshToken } = await this.loginDoctorUseCase.execute(email, password);
      setTokensInCookies(res, accessToken, refreshToken);
      res.status(200).json({ message: 'Logged in successfully' });
    } catch (error) {
      next(error);
    }
  }

  async googleSignIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      if (!token) throw new ValidationError('Google ID is required');
      const { accessToken, refreshToken } = await this.googleSignInDoctorUseCase.execute(token);
      setTokensInCookies(res, accessToken, refreshToken);
      res.status(200).json({ message: 'Logged in successfully' });
    } catch (error) {
      next(error);
    }
  }
}
