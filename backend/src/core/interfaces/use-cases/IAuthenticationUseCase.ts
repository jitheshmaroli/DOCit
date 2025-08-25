import { UserRole } from '../../../types';
import {
  ForgotPasswordResponseDTO,
  GoogleSignInResponseDTO,
  LoginResponseDTO,
  LogoutResponseDTO,
  RefreshTokenResponseDTO,
  ResendSignupOTPResponseDTO,
  ResetPasswordResponseDTO,
  SignupRequestDTO,
  SignupResponseDTO,
  VerifySignupOTPRequestDTO,
  VerifySignupOTPResponseDTO,
  LoginRequestDTO,
} from '../../../application/dtos/AuthDtos';

export interface IAuthenticationUseCase {
  loginAdmin(dto: LoginRequestDTO): Promise<LoginResponseDTO>;
  loginDoctor(dto: LoginRequestDTO): Promise<LoginResponseDTO>;
  loginPatient(dto: LoginRequestDTO): Promise<LoginResponseDTO>;
  googleSignInDoctor(token: string): Promise<GoogleSignInResponseDTO>;
  googleSignInPatient(token: string): Promise<GoogleSignInResponseDTO>;
  signupDoctor(dto: SignupRequestDTO): Promise<SignupResponseDTO>;
  signupPatient(dto: SignupRequestDTO): Promise<SignupResponseDTO>;
  forgotPassword(email: string): Promise<ForgotPasswordResponseDTO>;
  resetPassword(email: string, otp: string, newPassword: string): Promise<ResetPasswordResponseDTO>;
  verifySignUpOTP(dto: VerifySignupOTPRequestDTO): Promise<VerifySignupOTPResponseDTO>;
  refreshToken(refreshToken: string): Promise<RefreshTokenResponseDTO>;
  logout(userId: string, role: UserRole): Promise<LogoutResponseDTO>;
  resendSignupOTP(email: string, role: UserRole): Promise<ResendSignupOTPResponseDTO>;
}
