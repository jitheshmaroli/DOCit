import { Request, Response, NextFunction } from 'express';
import { ViewDoctorProfileUseCase } from '../../../core/use-cases/profile/ViewDoctorProfile';
import { UpdateDoctorProfileUseCase } from '../../../core/use-cases/profile/UpdateDoctorProfile';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';
import { ISpecialityRepository } from '../../../core/interfaces/repositories/ISpecialityRepository';
import fs from 'fs';

export class DoctorProfileController {
  private viewDoctorProfileUseCase: ViewDoctorProfileUseCase;
  private updateDoctorProfileUseCase: UpdateDoctorProfileUseCase;
  private specialityRepository: ISpecialityRepository;

  constructor(container: Container) {
    this.viewDoctorProfileUseCase = container.get('ViewDoctorProfileUseCase');
    this.updateDoctorProfileUseCase = container.get('UpdateDoctorProfileUseCase');
    this.specialityRepository = container.get('ISpecialityRepository');
  }

  async viewProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const doctor = await this.viewDoctorProfileUseCase.execute(id);
      res.status(200).json(doctor);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (updates.speciality) {
        const speciality = await this.specialityRepository.findAll();
        const validSpeciality = speciality.find((s) => s.name === updates.speciality);
        if (!validSpeciality) {
          throw new ValidationError('Invalid speciality');
        }
        updates.speciality = validSpeciality._id;
      }

      const doctor = await this.updateDoctorProfileUseCase.execute(id, updates, req.file);

      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      if (!doctor) {
        throw new ValidationError('Failed to update profile');
      }

      res.status(200).json(doctor);
    } catch (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }
}
