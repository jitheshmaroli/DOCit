import { IAuthenticationUseCase } from '../interfaces/use-cases/IAuthenticationUseCase';
import { Patient } from '../entities/Patient';
import { Doctor } from '../entities/Doctor';
import { IPatientRepository } from '../interfaces/repositories/IPatientRepository';
import { IDoctorRepository } from '../interfaces/repositories/IDoctorRepository';
import { IAdminRepository } from '../interfaces/repositories/IAdminRepository';
import { IOTPService } from '../interfaces/services/IOTPService';
import { ITokenService } from '../interfaces/services/ITokenService';
import { ValidationError, NotFoundError, AuthenticationError } from '../../utils/errors';
import logger from '../../utils/logger';
import bcrypt from 'bcrypt';
import { verifyGoogleToken } from '../../utils/googleAuth';
import { UserRole } from '../../types';

export class AuthenticationUseCase implements IAuthenticationUseCase {
  constructor(
    private _patientRepository: IPatientRepository,
    private _doctorRepository: IDoctorRepository,
    private _adminRepository: IAdminRepository,
    private _otpService: IOTPService,
    private _tokenService: ITokenService
  ) {}

  async loginAdmin(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!email || !password) {
      logger.error('Email and password are required for admin login');
      throw new ValidationError('Email and password are required');
    }

    const admin = await this._adminRepository.findByEmail(email);
    if (!admin) {
      logger.error(`Admin not found: ${email}`);
      throw new NotFoundError('Admin not found');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      logger.error(`Invalid password for admin: ${email}`);
      throw new AuthenticationError('Invalid credentials');
    }

    const accessToken = this._tokenService.generateAccessToken(admin._id!, 'admin');
    const refreshToken = this._tokenService.generateRefreshToken(admin._id!, 'admin');

    return { accessToken, refreshToken };
  }

  async loginDoctor(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!email || !password) {
      logger.error('Email and password are required for doctor login');
      throw new ValidationError('Email and password are required');
    }

    const doctor = await this._doctorRepository.findByEmail(email);
    if (!doctor) {
      logger.error(`Doctor not found: ${email}`);
      throw new NotFoundError('Doctor not found');
    }

    if (!doctor.password) {
      throw new AuthenticationError(
        'This account was created with Google. Please use Google Sign-In or add a password.'
      );
    }

    if (doctor.isBlocked) {
      logger.error(`Doctor is blocked: ${email}`);
      throw new AuthenticationError('Account is blocked');
    }

    const isPasswordValid = await bcrypt.compare(password, doctor.password);
    if (!isPasswordValid) {
      logger.error(`Invalid password for doctor: ${email}`);
      throw new AuthenticationError('Invalid credentials');
    }

    const accessToken = this._tokenService.generateAccessToken(doctor._id!, 'doctor');
    const refreshToken = this._tokenService.generateRefreshToken(doctor._id!, 'doctor');

    return { accessToken, refreshToken };
  }

  async loginPatient(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!email || !password) {
      logger.error('Email and password are required for patient login');
      throw new ValidationError('Email and password are required');
    }

    const patient = await this._patientRepository.findByEmail(email);
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

    const isPasswordValid = await bcrypt.compare(password, patient.password);
    if (!isPasswordValid) {
      logger.error(`Invalid password for patient: ${email}`);
      throw new AuthenticationError('Invalid credentials');
    }

    const accessToken = this._tokenService.generateAccessToken(patient._id!, 'patient');
    const refreshToken = this._tokenService.generateRefreshToken(patient._id!, 'patient');

    return { accessToken, refreshToken };
  }

  async googleSignInDoctor(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!token) {
      logger.error('Google token is required for doctor sign-in');
      throw new ValidationError('Google token is required');
    }

    const { googleId, email, name } = await verifyGoogleToken(token);

    let doctor = await this._doctorRepository.findByEmail(email);
    if (!doctor) {
      doctor = await this._doctorRepository.create({
        email,
        googleId,
        name,
        isVerified: false,
        isBlocked: false,
        speciality: '',
        allowFreeBooking: true,
      });
    } else if (!doctor.googleId) {
      doctor = await this._doctorRepository.update(doctor._id!, { googleId });
    }

    if (!doctor) throw new NotFoundError('Unexpected error: Doctor is null after creation/update');

    const accessToken = this._tokenService.generateAccessToken(doctor._id!, 'doctor');
    const refreshToken = this._tokenService.generateRefreshToken(doctor._id!, 'doctor');
    await this._doctorRepository.update(doctor._id!, { refreshToken });

    return { accessToken, refreshToken };
  }

  async googleSignInPatient(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!token) {
      logger.error('Google token is required for patient sign-in');
      throw new ValidationError('Google token is required');
    }

    const { googleId, email, name } = await verifyGoogleToken(token);

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

    return { accessToken, refreshToken };
  }

  async signupDoctor(doctor: Doctor): Promise<Doctor> {
    if (!doctor.email || !doctor.name || !doctor.password) {
      throw new ValidationError('Email, name, speciality, and password are required');
    }

    const existingDoctor = await this._doctorRepository.findByEmail(doctor.email);
    if (existingDoctor) {
      throw new ValidationError('Doctor with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(doctor.password, 10);
    const newDoctor: Doctor = {
      ...doctor,
      password: hashedPassword,
      isVerified: false,
      isOtpVerified: false,
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const savedDoctor = await this._doctorRepository.create(newDoctor);
      await this._otpService.sendOTP(savedDoctor.email);
      return savedDoctor;
    } catch (error) {
      logger.error(`Error signing up doctor: ${(error as Error).message}`);
      throw new Error('Failed to sign up doctor');
    }
  }

  async signupPatient(patient: Patient): Promise<Patient> {
    if (!patient.email || !patient.name || !patient.password) {
      logger.error('Missing required fields for patient signup');
      throw new ValidationError('Email, name, and password are required');
    }

    const existingPatient = await this._patientRepository.findByEmail(patient.email);
    if (existingPatient) {
      logger.error(`Patient with email ${patient.email} already exists`);
      throw new ValidationError('Patient with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(patient.password, 10);
    const newPatient: Patient = {
      ...patient,
      password: hashedPassword,
      isOtpVerified: false,
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const savedPatient = await this._patientRepository.create(newPatient);
      await this._otpService.sendOTP(savedPatient.email);
      return savedPatient;
    } catch (error) {
      logger.error(`Error signing up patient: ${(error as Error).message}`);
      throw new Error('Failed to sign up patient');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    if (!email) {
      logger.error('Email is required for password reset');
      throw new ValidationError('Email is required');
    }

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
    } catch (error) {
      logger.error(`Error sending OTP for password reset: ${(error as Error).message}`);
      throw new Error('Failed to send OTP');
    }
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    if (!email || !otp || !newPassword) {
      logger.error('Email, OTP, and new password are required for password reset');
      throw new ValidationError('Email, OTP, and new password are required');
    }

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
    } catch {
      throw new Error('Failed to delete OTP');
    }
  }

  async verifySignUpOTP(
    email: string,
    otp: string,
    entity: Doctor | Patient
  ): Promise<{
    newEntity: Patient | Doctor | null;
    accessToken: string;
    refreshToken: string;
  }> {
    if (!email || !otp || !entity || !entity._id) {
      throw new ValidationError('Email, OTP, entity, and entity ID are required');
    }

    const isValidOTP = await this._otpService.verifyOTP(email, otp);
    if (!isValidOTP) {
      throw new ValidationError('Invalid OTP');
    }

    let user: Patient | Doctor | null = null;
    let role: UserRole.Patient | UserRole.Doctor;
    if ('speciality' in entity) {
      role = UserRole.Doctor;
      user = await this._doctorRepository.findByEmail(email);
    } else {
      role = UserRole.Patient;
      user = await this._patientRepository.findByEmail(email);
    }

    if (!user) {
      throw new NotFoundError('User not found or ID mismatch');
    }

    if (user.isOtpVerified) {
      throw new ValidationError('User already verified');
    }

    try {
      let newEntity: Patient | Doctor | null;
      if (role === 'doctor') {
        newEntity = await this._doctorRepository.update(entity._id!, {
          isOtpVerified: true,
          updatedAt: new Date(),
        });
      } else {
        newEntity = await this._patientRepository.update(entity._id!, {
          isOtpVerified: true,
          updatedAt: new Date(),
        });
      }

      if (!newEntity) {
        throw new NotFoundError(`Failed to verify ${role}`);
      }

      const accessToken = this._tokenService.generateAccessToken(newEntity._id!, role);
      const refreshToken = this._tokenService.generateRefreshToken(newEntity._id!, role);

      await this._otpService.deleteOTP(email);

      return { newEntity, accessToken, refreshToken };
    } catch {
      throw new Error('Failed to verify OTP');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    try {
      const payload = this._tokenService.verifyRefreshToken(refreshToken);
      const accessToken = this._tokenService.generateAccessToken(payload.userId, payload.role);
      const newRefreshToken = this._tokenService.generateRefreshToken(payload.userId, payload.role);
      return { accessToken, refreshToken: newRefreshToken };
    } catch {
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  async logout(userId: string, role: UserRole): Promise<void> {
    if (!userId || !role) {
      logger.error('User ID and role are required for logout');
      throw new ValidationError('User ID and role are required');
    }

    try {
      if (role === UserRole.Patient) {
        await this._patientRepository.update(userId, { refreshToken: '' });
      } else if (role === UserRole.Doctor) {
        await this._doctorRepository.update(userId, { refreshToken: '' });
      } else {
        await this._adminRepository.update(userId, { refreshToken: '' });
      }
    } catch (error) {
      logger.error(`Error logging out user ${userId}: ${(error as Error).message}`);
      throw new Error('Failed to log out');
    }
  }

  async resendSignupOTP(email: string, role: UserRole.Patient | UserRole.Doctor): Promise<void> {
    if (!email || !role) {
      throw new ValidationError('Email and role are required');
    }

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
    } catch {
      throw new Error('Failed to resend OTP');
    }
  }
}
