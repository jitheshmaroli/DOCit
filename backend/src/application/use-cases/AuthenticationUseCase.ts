import { IAuthenticationUseCase } from '../../core/interfaces/use-cases/IAuthenticationUseCase';
import { Patient } from '../../core/entities/Patient';
import { Doctor } from '../../core/entities/Doctor';
import { IPatientRepository } from '../../core/interfaces/repositories/IPatientRepository';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { IAdminRepository } from '../../core/interfaces/repositories/IAdminRepository';
import { IOTPService } from '../../core/interfaces/services/IOTPService';
import { ITokenService } from '../../core/interfaces/services/ITokenService';
import { ValidationError, NotFoundError, AuthenticationError } from '../../utils/errors';
import logger from '../../utils/logger';
import bcrypt from 'bcrypt';
import { verifyGoogleToken } from '../../utils/googleAuth';
import { UserRole } from '../../types';
import {
  SignupRequestDTO,
  LoginResponseDTO,
  SignupResponseDTO,
  GoogleSignInResponseDTO,
  RefreshTokenResponseDTO,
  ForgotPasswordResponseDTO,
  ResetPasswordResponseDTO,
  VerifySignupOTPResponseDTO,
  ResendSignupOTPResponseDTO,
  VerifySignupOTPRequestDTO,
  LogoutResponseDTO,
  LoginRequestDTO,
} from '../dtos/AuthDtos';
import { AuthMapper } from '../mappers/AuthMapper';
import { IValidatorService } from '../../core/interfaces/services/IValidatorService';

export class AuthenticationUseCase implements IAuthenticationUseCase {
  constructor(
    private _patientRepository: IPatientRepository,
    private _doctorRepository: IDoctorRepository,
    private _adminRepository: IAdminRepository,
    private _otpService: IOTPService,
    private _tokenService: ITokenService,
    private _validatorService: IValidatorService
  ) {}

  async loginAdmin(dto: LoginRequestDTO): Promise<LoginResponseDTO> {
    // Validate required fields
    this._validatorService.validateRequiredFields({
      email: dto.email,
      password: dto.password,
    });

    // Validate email format
    this._validatorService.validateEmailFormat(dto.email);

    // Validate password format
    this._validatorService.validatePassword(dto.password);

    const admin = await this._adminRepository.findByEmail(dto.email);
    if (!admin) {
      logger.error(`Admin not found: ${dto.email}`);
      throw new NotFoundError('Admin not found');
    }

    if (!admin.password) {
      throw new AuthenticationError('This account was created without a password. Please reset.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, admin.password);
    if (!isPasswordValid) {
      logger.error(`Invalid password for admin: ${dto.email}`);
      throw new AuthenticationError('Invalid credentials');
    }

    const accessToken = this._tokenService.generateAccessToken(admin._id!, 'admin');
    const refreshToken = this._tokenService.generateRefreshToken(admin._id!, 'admin');

    return { accessToken, refreshToken, message: 'Logged in successfully' };
  }

  async loginDoctor(dto: LoginRequestDTO): Promise<LoginResponseDTO> {
    // Validate required fields
    this._validatorService.validateRequiredFields({
      email: dto.email,
      password: dto.password,
    });

    // Validate email format
    this._validatorService.validateEmailFormat(dto.email);

    // Validate password format
    this._validatorService.validatePassword(dto.password);

    const doctor = await this._doctorRepository.findByEmail(dto.email);
    if (!doctor) {
      logger.error(`Doctor not found: ${dto.email}`);
      throw new NotFoundError('Doctor not found');
    }

    if (!doctor.password) {
      throw new AuthenticationError(
        'This account was created with Google. Please use Google Sign-In or add a password.'
      );
    }

    if (doctor.isBlocked) {
      logger.error(`Doctor is blocked: ${dto.email}`);
      throw new AuthenticationError('Account is blocked');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, doctor.password);
    if (!isPasswordValid) {
      logger.error(`Invalid password for doctor: ${dto.email}`);
      throw new AuthenticationError('Invalid credentials');
    }

    const accessToken = this._tokenService.generateAccessToken(doctor._id!, 'doctor');
    const refreshToken = this._tokenService.generateRefreshToken(doctor._id!, 'doctor');

    return { accessToken, refreshToken, message: 'Logged in successfully' };
  }

  async loginPatient(dto: LoginRequestDTO): Promise<LoginResponseDTO> {
    // Validate required fields
    this._validatorService.validateRequiredFields({
      email: dto.email,
      password: dto.password,
    });

    // Validate email format
    this._validatorService.validateEmailFormat(dto.email);

    // Validate password format
    this._validatorService.validatePassword(dto.password);

    const patient = await this._patientRepository.findByEmail(dto.email);
    logger.info('patient:', patient);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    if (!patient.password) {
      throw new AuthenticationError(
        'This account was created with Google. Please use Google Sign-In or add a password.'
      );
    }

    if (patient.isBlocked) {
      throw new AuthenticationError('Account is blocked');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, patient.password);
    if (!isPasswordValid) {
      logger.error(`Invalid password for patient: ${dto.email}`);
      throw new AuthenticationError('Invalid credentials');
    }

    const accessToken = this._tokenService.generateAccessToken(patient._id!, 'patient');
    const refreshToken = this._tokenService.generateRefreshToken(patient._id!, 'patient');

    return { accessToken, refreshToken, message: 'Logged in successfully' };
  }

  async googleSignInDoctor(token: string): Promise<GoogleSignInResponseDTO> {
    // Validate token
    this._validatorService.validateRequiredFields({ token });

    // Validate token length (assuming it should be non-empty and reasonable length)
    this._validatorService.validateLength(token, 1, 2000);

    const { googleId, email, name } = await verifyGoogleToken(token);

    // Validate extracted fields
    this._validatorService.validateRequiredFields({ googleId, email, name });
    this._validatorService.validateEmailFormat(email);
    this._validatorService.validateName(name);

    // Check if email is already registered as a patient
    const existingPatient = await this._patientRepository.findByEmail(email);
    if (existingPatient) {
      logger.error(`Email already registered as patient: ${email}`);
      throw new ValidationError('Email is already registered as a patient');
    }

    let doctor = await this._doctorRepository.findByEmail(email);
    if (!doctor) {
      doctor = await this._doctorRepository.create({
        email,
        googleId,
        name,
        isVerified: false,
        isBlocked: false,
        allowFreeBooking: true,
      });
    } else if (!doctor.googleId) {
      doctor = await this._doctorRepository.update(doctor._id!, { googleId });
    }

    if (!doctor) throw new NotFoundError('Unexpected error: Doctor is null after creation/update');

    if (doctor.isBlocked) {
      logger.error(`Doctor is blocked: ${email}`);
      throw new AuthenticationError('Account is blocked');
    }

    const accessToken = this._tokenService.generateAccessToken(doctor._id!, 'doctor');
    const refreshToken = this._tokenService.generateRefreshToken(doctor._id!, 'doctor');
    await this._doctorRepository.update(doctor._id!, { refreshToken });

    return { accessToken, refreshToken, message: 'Logged in successfully' };
  }

  async googleSignInPatient(token: string): Promise<GoogleSignInResponseDTO> {
    // Validate token
    this._validatorService.validateRequiredFields({ token });

    // Validate token length
    this._validatorService.validateLength(token, 1, 2000);

    const { googleId, email, name } = await verifyGoogleToken(token);

    // Validate extracted fields
    this._validatorService.validateRequiredFields({ googleId, email, name });
    this._validatorService.validateEmailFormat(email);
    this._validatorService.validateName(name);

    // Check if email is already registered as a doctor
    const existingDoctor = await this._doctorRepository.findByEmail(email);
    if (existingDoctor) {
      logger.error(`Email already registered as doctor: ${email}`);
      throw new ValidationError('Email is already registered as a doctor');
    }

    let patient = await this._patientRepository.findByEmail(email);
    if (!patient) {
      patient = await this._patientRepository.create({
        email,
        googleId,
        name,
        isSubscribed: false,
        isBlocked: false,
      });
    } else if (!patient.googleId) {
      patient = await this._patientRepository.update(patient._id!, { googleId });
    }

    if (!patient) throw new NotFoundError('Unexpected error: Patient is null after creation/update');

    const accessToken = this._tokenService.generateAccessToken(patient._id!, 'patient');
    const refreshToken = this._tokenService.generateRefreshToken(patient._id!, 'patient');
    await this._patientRepository.update(patient._id!, { refreshToken });

    return { accessToken, refreshToken, message: 'Logged in successfully' };
  }

  async signupDoctor(dto: SignupRequestDTO): Promise<SignupResponseDTO> {
    // Validate required fields
    this._validatorService.validateRequiredFields({
      email: dto.email,
      name: dto.name,
      password: dto.password,
      licenseNumber: dto.licenseNumber,
    });

    // Validate email, name, password, and license number
    this._validatorService.validateEmailFormat(dto.email);
    this._validatorService.validateName(dto.name);
    this._validatorService.validatePassword(dto.password);
    this._validatorService.validateLicenseNumber(dto.licenseNumber!);

    // Check if email is already registered as a doctor or patient
    const existingDoctor = await this._doctorRepository.findByEmail(dto.email);
    if (existingDoctor) {
      logger.error(`Doctor with email ${dto.email} already exists`);
      throw new ValidationError('Email is already registered as a doctor');
    }
    const existingPatient = await this._patientRepository.findByEmail(dto.email);
    if (existingPatient) {
      logger.error(`Email already registered as patient: ${dto.email}`);
      throw new ValidationError('Email is already registered as a patient');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newDoctor = AuthMapper.mapDoctorToEntity({ ...dto, password: hashedPassword });

    try {
      const savedDoctor = await this._doctorRepository.create(newDoctor);
      await this._otpService.sendOTP(savedDoctor.email);
      return { message: 'OTP sent successfully', _id: savedDoctor._id! };
    } catch (error) {
      logger.error(`Error signing up doctor: ${(error as Error).message}`);
      throw new Error('Failed to sign up doctor');
    }
  }

  async signupPatient(dto: SignupRequestDTO): Promise<SignupResponseDTO> {
    // Validate required fields
    this._validatorService.validateRequiredFields({
      email: dto.email,
      name: dto.name,
      password: dto.password,
    });

    // Validate email, name, and password
    this._validatorService.validateEmailFormat(dto.email);
    this._validatorService.validateName(dto.name);
    this._validatorService.validatePassword(dto.password);

    // Check if email is already registered as a doctor or patient
    const existingPatient = await this._patientRepository.findByEmail(dto.email);
    if (existingPatient) {
      logger.error(`Patient with email ${dto.email} already exists`);
      throw new ValidationError('Email is already registered as a patient');
    }
    const existingDoctor = await this._doctorRepository.findByEmail(dto.email);
    if (existingDoctor) {
      logger.error(`Email already registered as doctor: ${dto.email}`);
      throw new ValidationError('Email is already registered as a doctor');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newPatient = AuthMapper.mapPatientToEntity({ ...dto, password: hashedPassword });

    try {
      const savedPatient = await this._patientRepository.create(newPatient);
      await this._otpService.sendOTP(savedPatient.email);
      return { message: 'OTP sent successfully', _id: savedPatient._id! };
    } catch (error) {
      logger.error(`Error signing up patient: ${(error as Error).message}`);
      throw new Error('Failed to sign up patient');
    }
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponseDTO> {
    // Validate email
    this._validatorService.validateRequiredFields({ email });
    this._validatorService.validateEmailFormat(email);

    const user =
      (await this._patientRepository.findByEmail(email)) ||
      (await this._doctorRepository.findByEmail(email)) ||
      (await this._adminRepository.findByEmail(email));
    if (!user) {
      logger.error(`User not found for password reset: ${email}`);
      throw new NotFoundError('User not found');
    }

    try {
      await this._otpService.deleteOTP(email);
      await this._otpService.sendOTP(email);
      return { message: 'OTP sent successfully' };
    } catch (error) {
      logger.error(`Error sending OTP for password reset: ${(error as Error).message}`);
      throw new Error('Failed to send OTP');
    }
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<ResetPasswordResponseDTO> {
    // Validate required fields
    this._validatorService.validateRequiredFields({ email, otp, newPassword });

    // Validate email, OTP, and password
    this._validatorService.validateEmailFormat(email);
    this._validatorService.validateOtp(otp);
    this._validatorService.validatePassword(newPassword);

    const isValidOTP = await this._otpService.verifyOTP(email, otp);
    if (!isValidOTP) {
      logger.error(`Invalid OTP for email: ${email}`);
      throw new ValidationError('Invalid or expired OTP');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const patient = await this._patientRepository.findByEmail(email);
    if (patient) {
      try {
        await this._patientRepository.update(patient._id!, {
          password: hashedPassword,
          updatedAt: new Date(),
        });
      } catch (error) {
        logger.error(`Error resetting password for patient email ${email}: ${(error as Error).message}`);
        throw new Error('Failed to reset password');
      }
    } else {
      const doctor = await this._doctorRepository.findByEmail(email);
      if (doctor) {
        try {
          await this._doctorRepository.update(doctor._id!, {
            password: hashedPassword,
            updatedAt: new Date(),
          });
        } catch (error) {
          logger.error(`Error resetting password for doctor email ${email}: ${(error as Error).message}`);
          throw new Error('Failed to reset password');
        }
      } else {
        const admin = await this._adminRepository.findByEmail(email);
        if (admin) {
          try {
            await this._adminRepository.update(admin._id!, {
              password: hashedPassword,
              updatedAt: new Date(),
            });
          } catch {
            throw new Error('Failed to reset password');
          }
        }
      }
    }

    try {
      await this._otpService.deleteOTP(email);
      return { message: 'Password reset successfully' };
    } catch {
      throw new Error('Failed to delete OTP');
    }
  }

  async verifySignUpOTP(dto: VerifySignupOTPRequestDTO): Promise<VerifySignupOTPResponseDTO> {
    // Validate required fields
    this._validatorService.validateRequiredFields({
      email: dto.email,
      otp: dto.otp,
      _id: dto._id,
      role: dto.role,
    });

    // Validate email, OTP, ID, and role
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

    logger.info('user:', user);
    logger.info('dto:', dto);

    if (!user || user._id?.toString() !== dto._id) {
      throw new NotFoundError('User not found or ID mismatch');
    }

    if (user.isOtpVerified) {
      throw new ValidationError('User already verified');
    }

    try {
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
    } catch {
      throw new Error('Failed to verify OTP');
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponseDTO> {
    // Validate token
    this._validatorService.validateRequiredFields({ refreshToken });

    // Validate token length
    this._validatorService.validateLength(refreshToken, 1, 2000);

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
    // Validate required fields
    this._validatorService.validateRequiredFields({ userId, role });

    // Validate ID and role
    this._validatorService.validateIdFormat(userId);
    this._validatorService.validateEnum(role, [UserRole.Patient, UserRole.Doctor, UserRole.Admin]);

    try {
      if (role === UserRole.Patient) {
        await this._patientRepository.update(userId, { refreshToken: '' });
      } else if (role === UserRole.Doctor) {
        await this._doctorRepository.update(userId, { refreshToken: '' });
      } else {
        await this._adminRepository.update(userId, { refreshToken: '' });
      }
      return { message: 'Logged out successfully' };
    } catch (error) {
      logger.error(`Error logging out user ${userId}: ${(error as Error).message}`);
      throw new Error('Failed to log out');
    }
  }

  async resendSignupOTP(email: string, role: UserRole): Promise<ResendSignupOTPResponseDTO> {
    // Validate required fields
    this._validatorService.validateRequiredFields({ email, role });

    // Validate email and role
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

    try {
      await this._otpService.deleteOTP(email);
      await this._otpService.sendOTP(email);
      return { message: 'OTP sent successfully' };
    } catch {
      throw new Error('Failed to resend OTP');
    }
  }
}
