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
    private doctorRepository: IDoctorRepository,
    private patientRepository: IPatientRepository,
    private specialityRepository: ISpecialityRepository,
    private imageUploadService: IImageUploadService
  ) {}

  async viewDoctorProfile(doctorId: string): Promise<Doctor> {
    if (!doctorId) {
      logger.error('Doctor ID is required for viewing profile');
      throw new ValidationError('Doctor ID is required');
    }

    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) {
      logger.error(`Doctor not found: ${doctorId}`);
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

    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) {
      logger.error(`Doctor not found: ${doctorId}`);
      throw new NotFoundError('Doctor not found');
    }

    if (updates.email && updates.email !== doctor.email) {
      const existingDoctor = await this.doctorRepository.findByEmail(updates.email);
      if (existingDoctor) {
        logger.error(`Email ${updates.email} is already in use`);
        throw new ValidationError('Email is already in use');
      }
    }

    if (updates.speciality) {
      const speciality = await this.specialityRepository.findById(updates.speciality);
      if (!speciality) {
        logger.error(`Speciality not found: ${updates.speciality}`);
        throw new NotFoundError('Speciality not found');
      }
    }

    if (updates.experiences) {
      updates.experiences.forEach((exp, index) => {
        if (!exp.hospitalName || !exp.department || exp.years == null || exp.years < 0 || exp.years > 99) {
          logger.error(`Invalid experience entry at index ${index}: ${JSON.stringify(exp)}`);
          throw new ValidationError(`Invalid experience entry at index ${index}`);
        }
      });
    }

    let profilePicture: string | undefined;
    if (file) {
      try {
        const uploadResult = await this.imageUploadService.uploadFile(file, 'doctor-profiles');
        profilePicture = uploadResult.url; // Extract the URL string
        logger.debug(`Profile picture uploaded: ${profilePicture}, publicId: ${uploadResult.publicId}`);
      } catch (error) {
        logger.error(`Error uploading profile picture: ${(error as Error).message}`);
        throw new Error('Failed to upload profile picture');
      }
    }

    try {
      const updatedDoctor = await this.doctorRepository.update(doctorId, {
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

    const patient = await this.patientRepository.findById(patientId);
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
      logger.error('Patient ID is required for updating profile');
      throw new ValidationError('Patient ID is required');
    }

    const patient = await this.patientRepository.findById(patientId);
    if (!patient) {
      logger.error(`Patient not found: ${patientId}`);
      throw new NotFoundError('Patient not found');
    }

    if (updates.email && updates.email !== patient.email) {
      const existingPatient = await this.patientRepository.findByEmail(updates.email);
      if (existingPatient) {
        logger.error(`Email ${updates.email} is already in use`);
        throw new ValidationError('Email is already in use');
      }
    }

    let profilePicture: unknown;
    if (file) {
      try {
        profilePicture = await this.imageUploadService.uploadFile(file, 'patient-profiles');
      } catch (error) {
        logger.error(`Error uploading profile picture: ${(error as Error).message}`);
        throw new Error('Failed to upload profile picture');
      }
    }

    try {
      const updatedPatient = await this.patientRepository.update(patientId, {
        ...updates,
        profilePicture: profilePicture || updates.profilePicture || patient.profilePicture,
        updatedAt: new Date(),
      });
      if (!updatedPatient) {
        logger.error(`Failed to update patient profile ${patientId}`);
        throw new NotFoundError('Failed to update patient profile');
      }
      return updatedPatient;
    } catch (error) {
      logger.error(`Error updating patient profile ${patientId}: ${(error as Error).message}`);
      throw new Error('Failed to update patient profile');
    }
  }
}
