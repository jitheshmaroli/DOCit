import { Request, Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/di/container';
import { validateEmail, validatePassword, validatePhone } from '../../../utils/validators';
import { ValidationError } from '../../../utils/errors';
import { setTokensInCookies } from '../../../utils/cookieUtils';
import { SignupDoctorUseCase } from '../../../core/use-cases/auth/doctor/SignupDoctorUseCase';
import { LoginDoctorUseCase } from '../../../core/use-cases/auth/doctor/LoginDoctorUseCase';
import { GoogleSignInDoctorUseCase } from '../../../core/use-cases/auth/doctor/GoogleSignInDoctorUseCase';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';

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
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      await this.signupDoctorUseCase.execute(doctor);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.OTP_SENT });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const { accessToken, refreshToken } = await this.loginDoctorUseCase.execute(email, password);
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
      const { accessToken, refreshToken } = await this.googleSignInDoctorUseCase.execute(token);
      setTokensInCookies(res, accessToken, refreshToken);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.LOGGED_IN });
    } catch (error) {
      next(error);
    }
  }
}
