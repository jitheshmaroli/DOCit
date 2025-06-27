import { Request, Response, NextFunction } from 'express';
import { ViewDoctorProfileUseCase } from '../../../core/use-cases/profile/ViewDoctorProfile';
import { UpdateDoctorProfileUseCase } from '../../../core/use-cases/profile/UpdateDoctorProfile';
import { GetAllSpecialitiesUseCase } from '../../../core/use-cases/doctor/GetAllSpecialitiesUseCase';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';
import fs from 'fs';
import logger from '../../../utils/logger';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';

export class DoctorProfileController {
  private viewDoctorProfileUseCase: ViewDoctorProfileUseCase;
  private updateDoctorProfileUseCase: UpdateDoctorProfileUseCase;
  private getAllSpecialitiesUseCase: GetAllSpecialitiesUseCase;

  constructor(container: Container) {
    this.viewDoctorProfileUseCase = container.get('ViewDoctorProfileUseCase');
    this.updateDoctorProfileUseCase = container.get('UpdateDoctorProfileUseCase');
    this.getAllSpecialitiesUseCase = container.get('GetAllSpecialitiesUseCase');
  }

  async viewProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const doctor = await this.viewDoctorProfileUseCase.execute(id);
      res.status(HttpStatusCode.OK).json(doctor);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (updates.speciality) {
        const specialities = await this.getAllSpecialitiesUseCase.execute();
        const validSpeciality = specialities.find((s) => s.name === updates.speciality);
        logger.debug('speciality:', updates.speciality);
        if (!validSpeciality) {
          throw new ValidationError(ResponseMessages.BAD_REQUEST);
        }
        updates.speciality = validSpeciality._id;
      }

      const doctor = await this.updateDoctorProfileUseCase.execute(id, updates, req.file);

      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      if (!doctor) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }

      res.status(HttpStatusCode.OK).json(doctor);
    } catch (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }
}
