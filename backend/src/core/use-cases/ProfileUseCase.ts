import { v2 as cloudinary } from 'cloudinary';
import { IProfileUseCase } from '../interfaces/use-cases/IProfileUseCase';
import { IDoctorRepository } from '../interfaces/repositories/IDoctorRepository';
import { IPatientRepository } from '../interfaces/repositories/IPatientRepository';
import { ISpecialityRepository } from '../interfaces/repositories/ISpecialityRepository';
import { IImageUploadService } from '../interfaces/services/IImageUploadService';
import { NotFoundError, ValidationError } from '../../utils/errors';
import logger from '../../utils/logger';
import { env } from '../../config/env';
import { DoctorDTO } from '../interfaces/DoctorDTOs';
import { PatientDTO } from '../interfaces/PatientDTOs';
import { DoctorMapper } from '../interfaces/mappers/DoctorMapper';
import { PatientMapper } from '../interfaces/mappers/PatientMapper';

export class ProfileUseCase implements IProfileUseCase {
  constructor(
    private _doctorRepository: IDoctorRepository,
    private _patientRepository: IPatientRepository,
    private _specialityRepository: ISpecialityRepository,
    private _imageUploadService: IImageUploadService
  ) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      signature_algorithm: 'sha256',
    });
  }

  async viewDoctorProfile(doctorId: string): Promise<DoctorDTO> {
    if (!doctorId) {
      logger.error('Doctor ID is required for viewing profile');
      throw new ValidationError('Doctor ID is required');
    }

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      logger.error(`Doctor not found: ${doctorId}`);
      throw new NotFoundError('Doctor not found');
    }

    return DoctorMapper.toDTO(doctor);
  }

  async updateDoctorProfile(
    doctorId: string,
    updates: Partial<DoctorDTO>,
    profilePictureFile?: Express.Multer.File,
    licenseProofFile?: Express.Multer.File
  ): Promise<DoctorDTO | null> {
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
    if (profilePictureFile) {
      try {
        const uploadResult = await this._imageUploadService.uploadFile(profilePictureFile, 'doctor-profiles');
        profilePicture = uploadResult.url;
      } catch (error) {
        logger.error(`Error uploading profile picture: ${(error as Error).message}`);
        throw new Error('Failed to upload profile picture');
      }
    }

    let licenseProof: string | undefined;
    if (licenseProofFile) {
      try {
        const uploadResult = await this._imageUploadService.uploadFile(licenseProofFile, 'doctor-proofs');
        logger.info('uploadresult:', uploadResult);
        licenseProof = uploadResult.url;
      } catch (error) {
        logger.error(`Error uploading license proof: ${(error as Error).message}`);
        throw new Error('Failed to upload license proof');
      }
    }

    try {
      const updatedDoctor = await this._doctorRepository.update(doctorId, {
        ...updates,
        profilePicture: profilePicture || updates.profilePicture || doctor.profilePicture,
        licenseProof: licenseProof || updates.licenseProof || doctor.licenseProof,
        updatedAt: new Date(),
      });
      if (!updatedDoctor) {
        logger.error(`Failed to update doctor profile ${doctorId}`);
        throw new NotFoundError('Failed to update doctor profile');
      }

      return DoctorMapper.toDTO(updatedDoctor);
    } catch (error) {
      logger.error(`Error updating doctor profile ${doctorId}: ${(error as Error).message}`);
      throw new Error('Failed to update doctor profile');
    }
  }

  async viewPatientProfile(patientId: string): Promise<PatientDTO> {
    if (!patientId) {
      logger.error('Patient ID is required for viewing profile');
      throw new ValidationError('Patient ID is required');
    }

    const patient = await this._patientRepository.findById(patientId);
    if (!patient) {
      logger.error(`Patient not found: ${patientId}`);
      throw new NotFoundError('Patient not found');
    }

    return PatientMapper.toDTO(patient);
  }

  async updatePatientProfile(
    patientId: string,
    updates: Partial<PatientDTO>,
    file?: Express.Multer.File
  ): Promise<PatientDTO | null> {
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

    let profilePicture: string | undefined;
    if (file) {
      try {
        const uploadResult = await this._imageUploadService.uploadFile(file, 'patient-profiles');
        profilePicture = uploadResult.url;
      } catch (error) {
        logger.error(`Error uploading profile picture: ${(error as Error).message}`);
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
        logger.error(`Failed to update patient profile ${patientId}`);
        throw new NotFoundError('Failed to update patient profile');
      }
      return PatientMapper.toDTO(updatedPatient);
    } catch (error) {
      logger.error(`Error updating patient profile ${patientId}: ${(error as Error).message}`);
      throw new Error('Failed to update patient profile');
    }
  }
}
