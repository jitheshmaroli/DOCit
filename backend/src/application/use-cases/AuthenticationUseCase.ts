import { IAuthenticationUseCase } from '../../core/interfaces/use-cases/IAuthenticationUseCase';
import { Patient } from '../../core/entities/Patient';
import { Doctor } from '../../core/entities/Doctor';
import { IPatientRepository } from '../../core/interfaces/repositories/IPatientRepository';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { IAdminRepository } from '../../core/interfaces/repositories/IAdminRepository';
import { IOTPService } from '../../core/interfaces/services/IOTPService';
import { ITokenService } from '../../core/interfaces/services/ITokenService';
import { IAuthProvider } from '../../core/interfaces/services/IAuthProvider';
import { ValidationError, NotFoundError, AuthenticationError } from '../../utils/errors';
import bcrypt from 'bcrypt';
import { UserRole } from '../../types';
import {
  SignupRequestDTO,
  LoginResponseDTO,
  SignupResponseDTO,
  RefreshTokenResponseDTO,
  ForgotPasswordResponseDTO,
  ResetPasswordResponseDTO,
  VerifySignupOTPResponseDTO,
  ResendSignupOTPResponseDTO,
  VerifySignupOTPRequestDTO,
  LogoutResponseDTO,
} from '../dtos/AuthDtos';
import { AuthMapper } from '../mappers/AuthMapper';
import { IValidatorService } from '../../core/interfaces/services/IValidatorService';
import { AuthProviderData } from '../../types/authTypes';

export class AuthenticationUseCase implements IAuthenticationUseCase {
  constructor(
    private _patientRepository: IPatientRepository,
    private _doctorRepository: IDoctorRepository,
    private _adminRepository: IAdminRepository,
    private _otpService: IOTPService,
    private _tokenService: ITokenService,
    private _validatorService: IValidatorService,
    private _authProviders: Record<string, IAuthProvider>
  ) {}

  async signIn(role: UserRole, providerName: string, data: AuthProviderData): Promise<LoginResponseDTO> {
    const provider = this._authProviders[providerName];
    if (!provider) throw new ValidationError('Unsupported provider');

    const user = await provider.authenticate(role, data);

    const userId = user._id!.toString();
    const accessToken = this._tokenService.generateAccessToken(userId, role);
    const refreshToken = this._tokenService.generateRefreshToken(userId, role);

    return { accessToken, refreshToken, message: 'Logged in successfully' };
  }

  async signupDoctor(dto: SignupRequestDTO): Promise<SignupResponseDTO> {
    this._validatorService.validateRequiredFields({
      email: dto.email,
      name: dto.name,
      password: dto.password,
      licenseNumber: dto.licenseNumber,
    });
    this._validatorService.validateEmailFormat(dto.email);
    this._validatorService.validateName(dto.name);
    this._validatorService.validatePassword(dto.password);
    this._validatorService.validateLicenseNumber(dto.licenseNumber!);

    const existingDoctor = await this._doctorRepository.findByEmail(dto.email);
    if (existingDoctor) {
      throw new ValidationError('Email is already registered as a doctor');
    }
    const existingPatient = await this._patientRepository.findByEmail(dto.email);
    if (existingPatient) {
      throw new ValidationError('Email is already registered as a patient');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newDoctor = AuthMapper.mapDoctorToEntity({ ...dto, password: hashedPassword });

    const savedDoctor = await this._doctorRepository.create(newDoctor);
    await this._otpService.sendOTP(savedDoctor.email);
    return { message: 'OTP sent successfully', _id: savedDoctor._id! };
  }

  async signupPatient(dto: SignupRequestDTO): Promise<SignupResponseDTO> {
    this._validatorService.validateRequiredFields({
      email: dto.email,
      name: dto.name,
      password: dto.password,
    });
    this._validatorService.validateEmailFormat(dto.email);
    this._validatorService.validateName(dto.name);
    this._validatorService.validatePassword(dto.password);

    const existingPatient = await this._patientRepository.findByEmail(dto.email);
    if (existingPatient) {
      throw new ValidationError('Email is already registered as a patient');
    }
    const existingDoctor = await this._doctorRepository.findByEmail(dto.email);
    if (existingDoctor) {
      throw new ValidationError('Email is already registered as a doctor');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newPatient = AuthMapper.mapPatientToEntity({ ...dto, password: hashedPassword });

    const savedPatient = await this._patientRepository.create(newPatient);
    await this._otpService.sendOTP(savedPatient.email);
    return { message: 'OTP sent successfully', _id: savedPatient._id! };
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponseDTO> {
    this._validatorService.validateRequiredFields({ email });
    this._validatorService.validateEmailFormat(email);

    const user =
      (await this._patientRepository.findByEmail(email)) ||
      (await this._doctorRepository.findByEmail(email)) ||
      (await this._adminRepository.findByEmail(email));
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await this._otpService.deleteOTP(email);
    await this._otpService.sendOTP(email);
    return { message: 'OTP sent successfully' };
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<ResetPasswordResponseDTO> {
    this._validatorService.validateRequiredFields({ email, otp, newPassword });
    this._validatorService.validateEmailFormat(email);
    this._validatorService.validateOtp(otp);
    this._validatorService.validatePassword(newPassword);

    const isValidOTP = await this._otpService.verifyOTP(email, otp);
    if (!isValidOTP) {
      throw new ValidationError('Invalid or expired OTP');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const patient = await this._patientRepository.findByEmail(email);
    if (patient) {
      await this._patientRepository.update(patient._id!, {
        password: hashedPassword,
        updatedAt: new Date(),
      });
    } else {
      const doctor = await this._doctorRepository.findByEmail(email);
      if (doctor) {
        await this._doctorRepository.update(doctor._id!, {
          password: hashedPassword,
          updatedAt: new Date(),
        });
      } else {
        const admin = await this._adminRepository.findByEmail(email);
        if (admin) {
          await this._adminRepository.update(admin._id!, {
            password: hashedPassword,
            updatedAt: new Date(),
          });
        }
      }
    }

    await this._otpService.deleteOTP(email);
    return { message: 'Password reset successfully' };
  }

  async verifySignUpOTP(dto: VerifySignupOTPRequestDTO): Promise<VerifySignupOTPResponseDTO> {
    this._validatorService.validateRequiredFields({
      email: dto.email,
      otp: dto.otp,
      _id: dto._id,
      role: dto.role,
    });
    this._validatorService.validateEmailFormat(dto.email);
    this._validatorService.validateOtp(dto.otp);
    this._validatorService.validateIdFormat(dto._id);
    this._validatorService.validateEnum(dto.role, [UserRole.Doctor, UserRole.Patient]);

    const isValidOTP = await this._otpService.verifyOTP(dto.email, dto.otp);
    if (!isValidOTP) {
      throw new ValidationError('Invalid OTP');
    }

    let user: Patient | Doctor | null = null;
    const role: UserRole.Patient | UserRole.Doctor = dto.role;
    if (dto.role === UserRole.Doctor) {
      user = await this._doctorRepository.findByEmail(dto.email);
    } else {
      user = await this._patientRepository.findByEmail(dto.email);
    }

    if (!user || user._id?.toString() !== dto._id) {
      throw new NotFoundError('User not found or ID mismatch');
    }

    if (user.isOtpVerified) {
      throw new ValidationError('User already verified');
    }

    let newEntity: Patient | Doctor | null;
    if (dto.role === UserRole.Doctor) {
      newEntity = await this._doctorRepository.update(dto._id, {
        isOtpVerified: true,
        updatedAt: new Date(),
      });
    } else {
      newEntity = await this._patientRepository.update(dto._id, {
        isOtpVerified: true,
        updatedAt: new Date(),
      });
    }

    if (!newEntity) {
      throw new NotFoundError(`Failed to verify ${dto.role}`);
    }

    const accessToken = this._tokenService.generateAccessToken(newEntity._id!, role);
    const refreshToken = this._tokenService.generateRefreshToken(newEntity._id!, role);

    await this._otpService.deleteOTP(dto.email);

    return AuthMapper.mapEntityToVerifySignupResponseDTO(newEntity, role, accessToken, refreshToken);
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponseDTO> {
    this._validatorService.validateRequiredFields({ refreshToken });

    try {
      const payload = this._tokenService.verifyRefreshToken(refreshToken);
      const accessToken = this._tokenService.generateAccessToken(payload.userId, payload.role);
      const newRefreshToken = this._tokenService.generateRefreshToken(payload.userId, payload.role);
      return { accessToken, refreshToken: newRefreshToken, message: 'Token refreshed successfully' };
    } catch {
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  async logout(userId: string, role: UserRole): Promise<LogoutResponseDTO> {
    this._validatorService.validateRequiredFields({ userId, role });
    this._validatorService.validateIdFormat(userId);
    this._validatorService.validateEnum(role, [UserRole.Patient, UserRole.Doctor, UserRole.Admin]);

    if (role === UserRole.Patient) {
      await this._patientRepository.update(userId, { refreshToken: '' });
    } else if (role === UserRole.Doctor) {
      await this._doctorRepository.update(userId, { refreshToken: '' });
    } else {
      await this._adminRepository.update(userId, { refreshToken: '' });
    }
    return { message: 'Logged out successfully' };
  }

  async resendSignupOTP(email: string, role: UserRole): Promise<ResendSignupOTPResponseDTO> {
    this._validatorService.validateRequiredFields({ email, role });
    this._validatorService.validateEmailFormat(email);
    this._validatorService.validateEnum(role, [UserRole.Patient, UserRole.Doctor]);

    let user: Patient | Doctor | null = null;
    if (role === UserRole.Patient) {
      user = await this._patientRepository.findByEmail(email);
    } else if (role === UserRole.Doctor) {
      user = await this._doctorRepository.findByEmail(email);
    }

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isOtpVerified) {
      throw new ValidationError('User already verified');
    }

    await this._otpService.deleteOTP(email);
    await this._otpService.sendOTP(email);
    return { message: 'OTP sent successfully' };
  }
}
