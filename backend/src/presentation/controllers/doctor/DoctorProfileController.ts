import { Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';
import { IProfileUseCase } from '../../../core/interfaces/use-cases/IProfileUseCase';
import { ISpecialityUseCase } from '../../../core/interfaces/use-cases/ISpecialityUseCase';
import fs from 'fs';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import logger from '../../../utils/logger';
import { CustomRequest } from '../../../types';

export class DoctorProfileController {
  private _profileUseCase: IProfileUseCase;
  private _specialityUseCase: ISpecialityUseCase;

  constructor(container: Container) {
    this._profileUseCase = container.get<IProfileUseCase>('IProfileUseCase');
    this._specialityUseCase = container.get<ISpecialityUseCase>('ISpecialityUseCase');
  }

  async viewProfile(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      const doctor = await this._profileUseCase.viewDoctorProfile(doctorId!);
      if (!doctor) {
        throw new ValidationError('Doctor not found');
      }
      res.status(HttpStatusCode.OK).json(doctor);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      const updates = { ...req.body };

      // Parse allowFreeBooking from string to boolean
      if (req.body.allowFreeBooking !== undefined) {
        if (req.body.allowFreeBooking === 'true') {
          updates.allowFreeBooking = true;
        } else if (req.body.allowFreeBooking === 'false') {
          updates.allowFreeBooking = false;
        } else {
          throw new ValidationError('allowFreeBooking must be "true" or "false"');
        }
      }

      if (req.body.qualifications) {
        let qualifications: string[];
        if (typeof req.body.qualifications === 'string') {
          qualifications = req.body.qualifications
            .split(',')
            .map((q: string) => q.trim())
            .filter((q: string) => q);
        } else if (Array.isArray(req.body.qualifications)) {
          qualifications = req.body.qualifications;
        } else {
          throw new ValidationError('Qualifications must be a comma-separated string or an array');
        }
        updates.qualifications = qualifications;
      }

      if (req.body.experiences) {
        let experiences: Array<{ hospitalName: string; department: string; years: number }>;
        if (typeof req.body.experiences === 'string') {
          try {
            experiences = JSON.parse(req.body.experiences);
          } catch {
            throw new ValidationError('Invalid experiences format: must be valid JSON');
          }
        } else if (Array.isArray(req.body.experiences)) {
          experiences = req.body.experiences;
        } else {
          throw new ValidationError('Experiences must be a JSON string or an array');
        }

        for (const [index, exp] of experiences.entries()) {
          if (
            !exp ||
            typeof exp !== 'object' ||
            typeof exp.hospitalName !== 'string' ||
            exp.hospitalName.trim() === '' ||
            typeof exp.department !== 'string' ||
            exp.department.trim() === '' ||
            typeof exp.years !== 'number' ||
            exp.years < 0
          ) {
            throw new ValidationError(
              `Invalid experience at index ${index}: must include valid hospitalName, department, and non-negative years`
            );
          }
        }
        updates.experiences = experiences;
      }

      if (req.body.speciality) {
        const specialities = await this._specialityUseCase.getAllSpecialities();
        const validSpeciality = specialities.find((s) => s.name === req.body.speciality);
        if (!validSpeciality) {
          throw new ValidationError(`Speciality "${req.body.speciality}" not found`);
        }
        updates.speciality = validSpeciality._id;
      }

      if (req.body.phone && typeof req.body.phone !== 'string') {
        throw new ValidationError('Phone must be a string');
      }
      if (req.body.gender && !['Male', 'Female', 'Other'].includes(req.body.gender)) {
        throw new ValidationError('Gender must be "Male", "Female", or "Other"');
      }
      if (req.body.location && typeof req.body.location !== 'string') {
        throw new ValidationError('Location must be a string');
      }

      // Handle files from req.files
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const profilePictureFile: Express.Multer.File | undefined = files?.['profilePicture']?.[0];
      const licenseProofFile: Express.Multer.File | undefined = files?.['licenseProof']?.[0];

      const doctor = await this._profileUseCase.updateDoctorProfile(
        doctorId!,
        updates,
        profilePictureFile,
        licenseProofFile
      );

      if (!doctor) {
        throw new ValidationError('Doctor not found or invalid update data');
      }

      // Clean up uploaded files from temp storage
      if (profilePictureFile) {
        try {
          fs.unlinkSync(profilePictureFile.path);
        } catch (error) {
          logger.error(`Failed to delete uploaded profile picture file: ${profilePictureFile.path}`, error);
        }
      }
      if (licenseProofFile) {
        try {
          fs.unlinkSync(licenseProofFile.path);
        } catch (error) {
          logger.error(`Failed to delete uploaded license proof file: ${licenseProofFile.path}`, error);
        }
      }

      res.status(HttpStatusCode.OK).json(doctor);
    } catch (error) {
      // Clean up on error
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      if (files?.['profilePicture']?.[0]) {
        try {
          fs.unlinkSync(files['profilePicture'][0].path);
        } catch (unlinkError) {
          logger.error(
            `Failed to delete uploaded profile picture on error: ${files['profilePicture'][0].path}`,
            unlinkError
          );
        }
      }
      if (files?.['licenseProof']?.[0]) {
        try {
          fs.unlinkSync(files['licenseProof'][0].path);
        } catch (unlinkError) {
          logger.error(
            `Failed to delete uploaded license proof on error: ${files['licenseProof'][0].path}`,
            unlinkError
          );
        }
      }
      logger.error(`Error in updateProfile: ${(error as Error).message}`);
      next(error);
    }
  }
}
