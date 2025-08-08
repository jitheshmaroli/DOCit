import { Request, Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';
import { IProfileUseCase } from '../../../core/interfaces/use-cases/IProfileUseCase';
import { ISpecialityUseCase } from '../../../core/interfaces/use-cases/ISpecialityUseCase';
import fs from 'fs';
import logger from '../../../utils/logger';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { Experience } from '../../../core/entities/Doctor';

export class DoctorProfileController {
  private _profileUseCase: IProfileUseCase;
  private _specialityUseCase: ISpecialityUseCase;

  constructor(container: Container) {
    this._profileUseCase = container.get<IProfileUseCase>('IProfileUseCase');
    this._specialityUseCase = container.get<ISpecialityUseCase>('ISpecialityUseCase');
  }

  async viewProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const doctor = await this._profileUseCase.viewDoctorProfile(id);
      if (!doctor) {
        throw new ValidationError('Doctor not found');
      }
      res.status(HttpStatusCode.OK).json(doctor);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.params.id;
      const updates = { ...req.body };

      // Convert allowFreeBooking string to boolean
      if (updates.allowFreeBooking !== undefined) {
        if (updates.allowFreeBooking === 'true') {
          updates.allowFreeBooking = true;
        } else if (updates.allowFreeBooking === 'false') {
          updates.allowFreeBooking = false;
        } else {
          logger.error(`Invalid allowFreeBooking value: ${updates.allowFreeBooking}`);
          throw new ValidationError('allowFreeBooking must be "true" or "false"');
        }
      }

      if (updates.qualifications) {
        if (typeof updates.qualifications === 'string') {
          updates.qualifications = updates.qualifications
            .split(',')
            .map((q: string) => q.trim())
            .filter((q: string) => q);
        } else if (!Array.isArray(updates.qualifications)) {
          logger.error('Invalid qualifications format: must be a string or array');
          throw new ValidationError('Qualifications must be a comma-separated string or an array');
        }
      }

      if (updates.experiences) {
        let experiences: Experience[];
        if (typeof updates.experiences === 'string') {
          try {
            experiences = JSON.parse(updates.experiences);
          } catch (error) {
            logger.error(`Failed to parse experiences: ${(error as Error).message}`);
            throw new ValidationError('Invalid experiences format: must be valid JSON');
          }
        } else if (Array.isArray(updates.experiences)) {
          experiences = updates.experiences;
        } else {
          logger.error('Invalid experiences format: must be a string or array');
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
            logger.error(`Invalid doświadczenie entry at index ${index}:`, exp);
            throw new ValidationError(
              `Invalid experience at index ${index}: must include valid hospitalName, department, and non-negative years`
            );
          }
        }
        updates.experiences = experiences;
      }

      if (updates.speciality) {
        const specialities = await this._specialityUseCase.getAllSpecialities();
        const validSpeciality = specialities.find((s) => s.name === updates.speciality);
        if (!validSpeciality) {
          throw new ValidationError(`Speciality "${updates.speciality}" not found`);
        }
        updates.speciality = validSpeciality._id;
      }

      if (updates.phone && typeof updates.phone !== 'string') {
        throw new ValidationError('Phone must be a string');
      }
      if (updates.gender && !['Male', 'Female', 'Other'].includes(updates.gender)) {
        throw new ValidationError('Gender must be "Male", "Female", or "Other"');
      }
      if (updates.location && typeof updates.location !== 'string') {
        throw new ValidationError('Location must be a string');
      }

      const doctor = await this._profileUseCase.updateDoctorProfile(doctorId, updates, req.file);

      if (!doctor) {
        throw new ValidationError('Doctor not found or invalid update data');
      }

      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (error) {
          logger.error(`Failed to delete uploaded file: ${req.file.path}`, error);
        }
      }

      res.status(HttpStatusCode.OK).json(doctor);
    } catch (error) {
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (error) {
          logger.error(`Failed to delete uploaded file: ${req.file.path}`, error);
        }
      }
      next(error);
    }
  }
}
