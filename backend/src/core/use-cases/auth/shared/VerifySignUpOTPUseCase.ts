import { Patient } from '../../../entities/Patient';
import { Doctor } from '../../../entities/Doctor';
import { IPatientRepository } from '../../../interfaces/repositories/IPatientRepository';
import { IDoctorRepository } from '../../../interfaces/repositories/IDoctorRepository';
import { IOTPService } from '../../../interfaces/services/IOTPService';
import { ITokenService } from '../../../interfaces/services/ITokenService';
import bcrypt from 'bcryptjs';
import { ValidationError } from '../../../../utils/errors';

export class VerifySignUpOTPUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private doctorRepository: IDoctorRepository,
    private otpService: IOTPService,
    private tokenService: ITokenService
  ) {}

  async execute(
    email: string,
    otp: string,
    entity: Doctor | Patient
  ): Promise<{
    newEntity: Patient | Doctor | null;
    accessToken: string;
    refreshToken: string;
  }> {
    if (!email || !otp || !entity.phone) {
      throw new ValidationError('Email, OTP, and phone are required');
    }

    const isValid = await this.otpService.verifyOTP(email, otp);
    if (!isValid) throw new ValidationError('Invalid or expired OTP');

    const existingPatient = await this.patientRepository.findByEmail(email);
    const existingDoctor = await this.doctorRepository.findByEmail(email);

    let updatedEntity: Patient | Doctor | null = null;
    let role: 'patient' | 'doctor' = 'patient';
    let entityId: string | undefined;

    if (existingPatient && existingPatient.googleId && entity.password) {
      const hashedPassword = await bcrypt.hash(entity.password, 10);
      updatedEntity = await this.patientRepository.update(existingPatient._id!, {
        password: hashedPassword,
        phone: entity.phone,
      });
      role = 'patient';
      entityId = existingPatient._id;
    } else if (existingDoctor && existingDoctor.googleId && entity.password) {
      if ('licenseNumber' in entity) {
        const hashedPassword = await bcrypt.hash(entity.password, 10);
        updatedEntity = await this.doctorRepository.update(existingDoctor._id!, {
          password: hashedPassword,
          phone: entity.phone,
          licenseNumber: entity.licenseNumber,
        });
        role = 'doctor';
        entityId = existingDoctor._id;
      }
    } else {
      if (entity.password) {
        entity.password = await bcrypt.hash(entity.password, 10);
      }

      entity.email = email;
      if ('licenseNumber' in entity) {
        console.log('it worlign');
        updatedEntity = await this.doctorRepository.create(entity);
        role = 'doctor';
      } else {
        updatedEntity = await this.patientRepository.create(entity as Patient);
        role = 'patient';
      }
      entityId = updatedEntity._id;
    }

    if (!updatedEntity || !entityId) {
      throw new Error('Failed to create or update entity');
    }

    const accessToken = this.tokenService.generateAccessToken(entityId, role);
    const refreshToken = this.tokenService.generateRefreshToken(entityId, role);

    if (role === 'patient') {
      await this.patientRepository.update(entityId, { refreshToken });
    } else {
      await this.doctorRepository.update(entityId, { refreshToken });
    }

    await this.otpService.deleteOTP(email);

    return { newEntity: updatedEntity, accessToken, refreshToken };
  }
}
