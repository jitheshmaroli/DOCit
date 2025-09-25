import { UserRole } from '../../../types';
import {
  ForgotPasswordResponseDTO,
  LoginResponseDTO,
  LogoutResponseDTO,
  RefreshTokenResponseDTO,
  ResendSignupOTPResponseDTO,
  ResetPasswordResponseDTO,
  SignupRequestDTO,
  SignupResponseDTO,
  VerifySignupOTPRequestDTO,
  VerifySignupOTPResponseDTO,
} from '../../../application/dtos/AuthDtos';
import { AuthProviderData } from '../../../types/authTypes';

export interface IAuthenticationUseCase {
  signIn(role: UserRole, providerName: string, data: AuthProviderData): Promise<LoginResponseDTO>;
  signupDoctor(dto: SignupRequestDTO): Promise<SignupResponseDTO>;
  signupPatient(dto: SignupRequestDTO): Promise<SignupResponseDTO>;
  forgotPassword(email: string): Promise<ForgotPasswordResponseDTO>;
  resetPassword(email: string, otp: string, newPassword: string): Promise<ResetPasswordResponseDTO>;
  verifySignUpOTP(dto: VerifySignupOTPRequestDTO): Promise<VerifySignupOTPResponseDTO>;
  refreshToken(refreshToken: string): Promise<RefreshTokenResponseDTO>;
  logout(userId: string, role: UserRole): Promise<LogoutResponseDTO>;
  resendSignupOTP(email: string, role: UserRole): Promise<ResendSignupOTPResponseDTO>;
}
