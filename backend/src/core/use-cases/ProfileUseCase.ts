import { IProfileUseCase } from '../interfaces/use-cases/IProfileUseCase';
import { Doctor } from '../entities/Doctor';
import { Patient } from '../entities/Patient';
import { IDoctorRepository } from '../interfaces/repositories/IDoctorRepository';
import { IPatientRepository } from '../interfaces/repositories/IPatientRepository';
import { ISpecialityRepository } from '../interfaces/repositories/ISpecialityRepository';
import { IImageUploadService } from '../interfaces/services/IImageUploadService';
import { NotFoundError, ValidationError } from '../../utils/errors';
import logger from '../../utils/logger';

export class ProfileUseCase implements IProfileUseCase {
  constructor(
    private _doctorRepository: IDoctorRepository,
    private _patientRepository: IPatientRepository,
    private _specialityRepository: ISpecialityRepository,
    private _imageUploadService: IImageUploadService
  ) {}

  async viewDoctorProfile(doctorId: string): Promise<Doctor> {
    if (!doctorId) {
      throw new ValidationError('Doctor ID is required');
    }

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    return doctor;
  }

  async updateDoctorProfile(
    doctorId: string,
    updates: Partial<Doctor>,
    file?: Express.Multer.File
  ): Promise<Doctor | null> {
    if (!doctorId) {
      logger.error('Doctor ID is required for updating profile');
      throw new ValidationError('Doctor ID is required');
    }

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      logger.error(`Doctor not found: ${doctorId}`);
      throw new NotFoundError('Doctor not found');
    }

    if (updates.email && updates.email !== doctor.email) {
      const existingDoctor = await this._doctorRepository.findByEmail(updates.email);
      if (existingDoctor) {
        logger.error(`Email ${updates.email} is already in use`);
        throw new ValidationError('Email is already in use');
      }
    }

    if (updates.speciality) {
      const speciality = await this._specialityRepository.findById(updates.speciality);
      if (!speciality) {
        throw new NotFoundError('Speciality not found');
      }
    }

    if (updates.experiences) {
      updates.experiences.forEach((exp, index) => {
        if (!exp.hospitalName || !exp.department || exp.years == null || exp.years < 0 || exp.years > 99) {
          throw new ValidationError(`Invalid experience entry at index ${index}`);
        }
      });
    }

    let profilePicture: string | undefined;
    if (file) {
      try {
        const uploadResult = await this._imageUploadService.uploadFile(file, 'doctor-profiles');
        profilePicture = uploadResult.url; // Extract the URL string
      } catch (error) {
        logger.error(`Error uploading profile picture: ${(error as Error).message}`);
        throw new Error('Failed to upload profile picture');
      }
    }

    try {
      const updatedDoctor = await this._doctorRepository.update(doctorId, {
        ...updates,
        profilePicture: profilePicture || updates.profilePicture || doctor.profilePicture,
        updatedAt: new Date(),
      });
      if (!updatedDoctor) {
        logger.error(`Failed to update doctor profile ${doctorId}`);
        throw new NotFoundError('Failed to update doctor profile');
      }
      return updatedDoctor;
    } catch (error) {
      logger.error(`Error updating doctor profile ${doctorId}: ${(error as Error).message}`);
      throw new Error('Failed to update doctor profile');
    }
  }

  async viewPatientProfile(patientId: string): Promise<Patient> {
    if (!patientId) {
      logger.error('Patient ID is required for viewing profile');
      throw new ValidationError('Patient ID is required');
    }

    const patient = await this._patientRepository.findById(patientId);
    if (!patient) {
      logger.error(`Patient not found: ${patientId}`);
      throw new NotFoundError('Patient not found');
    }

    return patient;
  }

  async updatePatientProfile(
    patientId: string,
    updates: Partial<Patient>,
    file?: Express.Multer.File
  ): Promise<Patient | null> {
    if (!patientId) {
      throw new ValidationError('Patient ID is required');
    }

    const patient = await this._patientRepository.findById(patientId);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    if (updates.email && updates.email !== patient.email) {
      const existingPatient = await this._patientRepository.findByEmail(updates.email);
      if (existingPatient) {
        throw new ValidationError('Email is already in use');
      }
    }

    let profilePicture: unknown;
    if (file) {
      try {
        profilePicture = await this._imageUploadService.uploadFile(file, 'patient-profiles');
      } catch {
        throw new Error('Failed to upload profile picture');
      }
    }

    try {
      const updatedPatient = await this._patientRepository.update(patientId, {
        ...updates,
        profilePicture: profilePicture || updates.profilePicture || patient.profilePicture,
        updatedAt: new Date(),
      });
      if (!updatedPatient) {
        throw new NotFoundError('Failed to update patient profile');
      }
      return updatedPatient;
    } catch {
      throw new Error('Failed to update patient profile');
    }
  }
}
