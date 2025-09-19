import { v2 as cloudinary } from 'cloudinary';
import { IProfileUseCase } from '../../core/interfaces/use-cases/IProfileUseCase';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { IPatientRepository } from '../../core/interfaces/repositories/IPatientRepository';
import { ISpecialityRepository } from '../../core/interfaces/repositories/ISpecialityRepository';
import { IImageUploadService } from '../../core/interfaces/services/IImageUploadService';
import { NotFoundError, ValidationError } from '../../utils/errors';
import logger from '../../utils/logger';
import { env } from '../../config/env';
import { DoctorDTO } from '../dtos/DoctorDTOs';
import { PatientDTO } from '../dtos/PatientDTOs';
import { DoctorMapper } from '../mappers/DoctorMapper';
import { PatientMapper } from '../mappers/PatientMapper';
import { IValidatorService } from '../../core/interfaces/services/IValidatorService';

export class ProfileUseCase implements IProfileUseCase {
  constructor(
    private _doctorRepository: IDoctorRepository,
    private _patientRepository: IPatientRepository,
    private _specialityRepository: ISpecialityRepository,
    private _imageUploadService: IImageUploadService,
    private _validatorService: IValidatorService
  ) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      signature_algorithm: 'sha256',
    });
  }

  async viewDoctorProfile(doctorId: string): Promise<DoctorDTO> {
    // Validate doctorId
    this._validatorService.validateRequiredFields({ doctorId });
    this._validatorService.validateIdFormat(doctorId);

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
    // Validate doctorId
    this._validatorService.validateRequiredFields({ doctorId });
    this._validatorService.validateIdFormat(doctorId);

    // Validate optional fields if provided
    if (updates.email) {
      this._validatorService.validateEmailFormat(updates.email);
    }
    if (updates.name) {
      this._validatorService.validateName(updates.name);
    }
    if (updates.speciality) {
      this._validatorService.validateIdFormat(updates.speciality);
    }
    if (updates.experiences) {
      updates.experiences.forEach((exp, index) => {
        this._validatorService.validateRequiredFields({
          hospitalName: exp.hospitalName,
          department: exp.department,
          years: exp.years,
        });
        this._validatorService.validateLength(exp.hospitalName!, 1, 100);
        this._validatorService.validateLength(exp.department!, 1, 100);
        if (exp.years == null || exp.years < 0 || exp.years > 99) {
          throw new ValidationError(`Invalid years in experience entry at index ${index}`);
        }
      });
    }

    // Validate file uploads
    if (profilePictureFile) {
      if (!['image/jpeg', 'image/png'].includes(profilePictureFile.mimetype)) {
        throw new ValidationError('Profile picture must be JPEG or PNG');
      }
      if (profilePictureFile.size > 2 * 1024 * 1024) {
        // 2MB limit
        throw new ValidationError('Profile picture size exceeds 2MB limit');
      }
    }
    if (licenseProofFile) {
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(licenseProofFile.mimetype)) {
        throw new ValidationError('License proof must be JPEG, PNG, or PDF');
      }
      if (licenseProofFile.size > 5 * 1024 * 1024) {
        // 5MB limit
        throw new ValidationError('License proof size exceeds 5MB limit');
      }
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
    // Validate patientId
    this._validatorService.validateRequiredFields({ patientId });
    this._validatorService.validateIdFormat(patientId);

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
    // Validate patientId
    this._validatorService.validateRequiredFields({ patientId });
    this._validatorService.validateIdFormat(patientId);

    // Validate optional fields if provided
    if (updates.email) {
      this._validatorService.validateEmailFormat(updates.email);
    }
    if (updates.name) {
      this._validatorService.validateName(updates.name);
    }

    // Validate file upload
    if (file) {
      if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
        throw new ValidationError('Profile picture must be JPEG or PNG');
      }
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        throw new ValidationError('Profile picture size exceeds 2MB limit');
      }
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
