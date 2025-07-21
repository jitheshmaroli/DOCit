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

export class AuthenticationUseCase implements IAuthenticationUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private doctorRepository: IDoctorRepository,
    private adminRepository: IAdminRepository,
    private otpService: IOTPService,
    private tokenService: ITokenService
  ) {}

  async loginAdmin(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!email || !password) {
      logger.error('Email and password are required for admin login');
      throw new ValidationError('Email and password are required');
    }

    const admin = await this.adminRepository.findByEmail(email);
    if (!admin) {
      logger.error(`Admin not found: ${email}`);
      throw new NotFoundError('Admin not found');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      logger.error(`Invalid password for admin: ${email}`);
      throw new AuthenticationError('Invalid credentials');
    }

    const accessToken = this.tokenService.generateAccessToken(admin._id!, 'admin');
    const refreshToken = this.tokenService.generateRefreshToken(admin._id!, 'admin');

    return { accessToken, refreshToken };
  }

  async loginDoctor(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!email || !password) {
      logger.error('Email and password are required for doctor login');
      throw new ValidationError('Email and password are required');
    }

    const doctor = await this.doctorRepository.findByEmail(email);
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

    const accessToken = this.tokenService.generateAccessToken(doctor._id!, 'doctor');
    const refreshToken = this.tokenService.generateRefreshToken(doctor._id!, 'doctor');

    return { accessToken, refreshToken };
  }

  async loginPatient(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!email || !password) {
      logger.error('Email and password are required for patient login');
      throw new ValidationError('Email and password are required');
    }

    const patient = await this.patientRepository.findByEmail(email);
    if (!patient) {
      logger.error(`Patient not found: ${email}`);
      throw new NotFoundError('Patient not found');
    }

    if (!patient.password) {
      throw new AuthenticationError(
        'This account was created with Google. Please use Google Sign-In or add a password.'
      );
    }

    if (patient.isBlocked) {
      logger.error(`Patient is blocked: ${email}`);
      throw new AuthenticationError('Account is blocked');
    }

    const isPasswordValid = await bcrypt.compare(password, patient.password);
    if (!isPasswordValid) {
      logger.error(`Invalid password for patient: ${email}`);
      throw new AuthenticationError('Invalid credentials');
    }

    const accessToken = this.tokenService.generateAccessToken(patient._id!, 'patient');
    const refreshToken = this.tokenService.generateRefreshToken(patient._id!, 'patient');

    return { accessToken, refreshToken };
  }

  async googleSignInDoctor(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!token) {
      logger.error('Google token is required for doctor sign-in');
      throw new ValidationError('Google token is required');
    }

    const { googleId, email, name } = await verifyGoogleToken(token);

    let doctor = await this.doctorRepository.findByEmail(email);
    if (!doctor) {
      doctor = await this.doctorRepository.create({
        email,
        googleId,
        name,
        isVerified: false,
        isBlocked: false,
        speciality: '',
        allowFreeBooking: true,
      });
    } else if (!doctor.googleId) {
      doctor = await this.doctorRepository.update(doctor._id!, { googleId });
    }

    if (!doctor) throw new NotFoundError('Unexpected error: Doctor is null after creation/update');

    const accessToken = this.tokenService.generateAccessToken(doctor._id!, 'doctor');
    const refreshToken = this.tokenService.generateRefreshToken(doctor._id!, 'doctor');
    await this.doctorRepository.update(doctor._id!, { refreshToken });

    return { accessToken, refreshToken };
  }

  async googleSignInPatient(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!token) {
      logger.error('Google token is required for patient sign-in');
      throw new ValidationError('Google token is required');
    }

    const { googleId, email, name } = await verifyGoogleToken(token);

    let patient = await this.patientRepository.findByEmail(email);
    if (!patient) {
      patient = await this.patientRepository.create({
        email,
        googleId,
        name,
        isSubscribed: false,
        isBlocked: false,
      });
    } else if (!patient.googleId) {
      patient = await this.patientRepository.update(patient._id!, { googleId });
    }

    if (!patient) throw new NotFoundError('Unexpected error: Patient is null after creation/update');

    const accessToken = this.tokenService.generateAccessToken(patient._id!, 'patient');
    const refreshToken = this.tokenService.generateRefreshToken(patient._id!, 'patient');
    await this.patientRepository.update(patient._id!, { refreshToken });

    return { accessToken, refreshToken };
  }

  async signupDoctor(doctor: Doctor): Promise<Doctor> {
    if (!doctor.email || !doctor.name || !doctor.password) {
      logger.error('Missing required fields for doctor signup');
      throw new ValidationError('Email, name, speciality, and password are required');
    }

    const existingDoctor = await this.doctorRepository.findByEmail(doctor.email);
    if (existingDoctor) {
      logger.error(`Doctor with email ${doctor.email} already exists`);
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
      const savedDoctor = await this.doctorRepository.create(newDoctor);
      await this.otpService.sendOTP(savedDoctor.email);
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

    const existingPatient = await this.patientRepository.findByEmail(patient.email);
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
      const savedPatient = await this.patientRepository.create(newPatient);
      await this.otpService.sendOTP(savedPatient.email);
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
      (await this.patientRepository.findByEmail(email)) ||
      (await this.doctorRepository.findByEmail(email)) ||
      (await this.adminRepository.findByEmail(email));
    if (!user) {
      logger.error(`User not found for password reset: ${email}`);
      throw new NotFoundError('User not found');
    }

    try {
      await this.otpService.deleteOTP(email);
      await this.otpService.sendOTP(email);
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

    const isValidOTP = await this.otpService.verifyOTP(email, otp);
    if (!isValidOTP) {
      logger.error(`Invalid OTP for email: ${email}`);
      throw new ValidationError('Invalid or expired OTP');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const patient = await this.patientRepository.findByEmail(email);
    if (patient) {
      try {
        await this.patientRepository.update(patient._id!, {
          password: hashedPassword,
          updatedAt: new Date(),
        });
      } catch (error) {
        logger.error(`Error resetting password for patient email ${email}: ${(error as Error).message}`);
        throw new Error('Failed to reset password');
      }
    } else {
      const doctor = await this.doctorRepository.findByEmail(email);
      if (doctor) {
        try {
          await this.doctorRepository.update(doctor._id!, {
            password: hashedPassword,
            updatedAt: new Date(),
          });
        } catch (error) {
          logger.error(`Error resetting password for doctor email ${email}: ${(error as Error).message}`);
          throw new Error('Failed to reset password');
        }
      } else {
        const admin = await this.adminRepository.findByEmail(email);
        if (admin) {
          try {
            await this.adminRepository.update(admin._id!, {
              password: hashedPassword,
              updatedAt: new Date(),
            });
          } catch (error) {
            logger.error(`Error resetting password for admin email ${email}: ${(error as Error).message}`);
            throw new Error('Failed to reset password');
          }
        }
      }
    }

    try {
      await this.otpService.deleteOTP(email);
    } catch (error) {
      logger.error(`Error deleting OTP for email ${email}: ${(error as Error).message}`);
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
      logger.error('Email, OTP, entity, and entity._id are required for OTP verification');
      throw new ValidationError('Email, OTP, entity, and entity ID are required');
    }

    const isValidOTP = await this.otpService.verifyOTP(email, otp);
    if (!isValidOTP) {
      logger.error(`Invalid OTP for email: ${email}`);
      throw new ValidationError('Invalid OTP');
    }

    let user: Patient | Doctor | null = null;
    let role: 'patient' | 'doctor';
    if ('speciality' in entity) {
      role = 'doctor';
      user = await this.doctorRepository.findByEmail(email);
    } else {
      role = 'patient';
      user = await this.patientRepository.findByEmail(email);
    }

    if (!user) {
      logger.error(`User not found or ID mismatch for email: ${email}, role: ${role}`);
      throw new NotFoundError('User not found or ID mismatch');
    }

    if (user.isOtpVerified) {
      logger.error(`User already OTP verified: ${email}`);
      throw new ValidationError('User already verified');
    }

    try {
      let newEntity: Patient | Doctor | null;
      if (role === 'doctor') {
        newEntity = await this.doctorRepository.update(entity._id!, {
          isOtpVerified: true,
          updatedAt: new Date(),
        });
      } else {
        newEntity = await this.patientRepository.update(entity._id!, {
          isOtpVerified: true,
          updatedAt: new Date(),
        });
      }

      if (!newEntity) {
        logger.error(`Failed to update ${role} with email ${email} during OTP verification`);
        throw new NotFoundError(`Failed to verify ${role}`);
      }

      const accessToken = this.tokenService.generateAccessToken(newEntity._id!, role);
      const refreshToken = this.tokenService.generateRefreshToken(newEntity._id!, role);

      await this.otpService.deleteOTP(email); // Delete OTP after successful verification

      return { newEntity, accessToken, refreshToken };
    } catch (error) {
      logger.error(`Error verifying OTP for email ${email}: ${(error as Error).message}`);
      throw new Error('Failed to verify OTP');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!refreshToken) {
      logger.error('Refresh token is required');
      throw new ValidationError('Refresh token is required');
    }

    try {
      const payload = this.tokenService.verifyRefreshToken(refreshToken);
      const accessToken = this.tokenService.generateAccessToken(payload.userId, payload.role);
      const newRefreshToken = this.tokenService.generateRefreshToken(payload.userId, payload.role);
      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      logger.error(`Error refreshing token: ${(error as Error).message}`);
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  async logout(userId: string, role: 'patient' | 'doctor' | 'admin'): Promise<void> {
    if (!userId || !role) {
      logger.error('User ID and role are required for logout');
      throw new ValidationError('User ID and role are required');
    }

    try {
      if (role === 'patient') {
        await this.patientRepository.update(userId, { refreshToken: '' });
      } else if (role === 'doctor') {
        await this.doctorRepository.update(userId, { refreshToken: '' });
      } else {
        await this.adminRepository.update(userId, { refreshToken: '' });
      }
    } catch (error) {
      logger.error(`Error logging out user ${userId}: ${(error as Error).message}`);
      throw new Error('Failed to log out');
    }
  }

  async resendSignupOTP(email: string, role: 'patient' | 'doctor'): Promise<void> {
    if (!email || !role) {
      logger.error('Email and role are required for resending OTP');
      throw new ValidationError('Email and role are required');
    }

    let user: Patient | Doctor | null = null;
    if (role === 'patient') {
      user = await this.patientRepository.findByEmail(email);
    } else if (role === 'doctor') {
      user = await this.doctorRepository.findByEmail(email);
    }

    if (!user) {
      logger.error(`User not found for OTP resend: ${email}`);
      throw new NotFoundError('User not found');
    }

    if (user.isOtpVerified) {
      logger.error(`User already OTP verified: ${email}`);
      throw new ValidationError('User already verified');
    }

    try {
      await this.otpService.deleteOTP(email);
      await this.otpService.sendOTP(email);
    } catch (error) {
      logger.error(`Error resending OTP for email ${email}: ${(error as Error).message}`);
      throw new Error('Failed to resend OTP');
    }
  }
}
