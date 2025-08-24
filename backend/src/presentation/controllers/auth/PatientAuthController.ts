import { Request, Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/di/container';
import { validateEmail, validatePassword, validatePhone } from '../../../utils/validators';
import { ValidationError } from '../../../utils/errors';
import { setTokensInCookies } from '../../../utils/cookieUtils';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';
import { IAuthenticationUseCase } from '../../../core/interfaces/use-cases/IAuthenticationUseCase';
import {
  SignupRequestDTO,
  SignupResponseDTO,
  LoginRequestDTO,
  LoginResponseDTO,
  GoogleSignInRequestDTO,
  GoogleSignInResponseDTO,
} from '../../../core/interfaces/AuthDtos';
import logger from '../../../utils/logger';

export class PatientAuthController {
  private _authenticationUseCase: IAuthenticationUseCase;

  constructor(container: Container) {
    this._authenticationUseCase = container.get<IAuthenticationUseCase>('IAuthenticationUseCase');
  }

  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signupDTO: SignupRequestDTO = {
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
        phone: req.body.phone,
        role: 'patient',
      };
      logger.info('Signup DTO:', signupDTO);
      if (!validateEmail(signupDTO.email) || !validatePassword(signupDTO.password) || !validatePhone(signupDTO.phone)) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const savedPatient = await this._authenticationUseCase.signupPatient(signupDTO);
      const responseDTO: SignupResponseDTO = {
        message: ResponseMessages.OTP_SENT,
        _id: savedPatient._id!,
      };
      res.status(HttpStatusCode.OK).json(responseDTO);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginDTO: LoginRequestDTO = {
        email: req.body.email,
        password: req.body.password,
      };
      if (!loginDTO.email || !loginDTO.password) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const { accessToken, refreshToken } = await this._authenticationUseCase.loginPatient(
        loginDTO.email,
        loginDTO.password
      );
      setTokensInCookies(res, accessToken, refreshToken);
      const responseDTO: LoginResponseDTO = {
        accessToken,
        refreshToken,
        message: ResponseMessages.LOGGED_IN,
      };
      res.status(HttpStatusCode.OK).json(responseDTO);
    } catch (error) {
      next(error);
    }
  }

  async googleSignIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const googleSignInDTO: GoogleSignInRequestDTO = {
        token: req.body.token,
      };
      if (!googleSignInDTO.token) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const { accessToken, refreshToken } = await this._authenticationUseCase.googleSignInPatient(
        googleSignInDTO.token
      );
      setTokensInCookies(res, accessToken, refreshToken);
      const responseDTO: GoogleSignInResponseDTO = {
        accessToken,
        refreshToken,
        message: ResponseMessages.LOGGED_IN,
      };
      res.status(HttpStatusCode.OK).json(responseDTO);
    } catch (error) {
      next(error);
    }
  }
}
