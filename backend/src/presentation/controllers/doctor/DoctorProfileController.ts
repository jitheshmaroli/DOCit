import { Request, Response, NextFunction } from 'express';
import { ViewDoctorProfileUseCase } from '../../../core/use-cases/profile/ViewDoctorProfile';
import { UpdateDoctorProfileUseCase } from '../../../core/use-cases/profile/UpdateDoctorProfile';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';
import { ISpecialityRepository } from '../../../core/interfaces/repositories/ISpecialityRepository';

export class DoctorProfileController {
  private viewDoctorProfileUseCase: ViewDoctorProfileUseCase;
  private updateDoctorProfileUseCase: UpdateDoctorProfileUseCase;
  private specialityRepository: ISpecialityRepository;

  constructor(container: Container) {
    this.viewDoctorProfileUseCase = container.get('ViewDoctorProfileUseCase');
    this.updateDoctorProfileUseCase = container.get(
      'UpdateDoctorProfileUseCase'
    );
    this.specialityRepository = container.get('ISpecialityRepository');
  }

  async viewProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const doctor = await this.viewDoctorProfileUseCase.execute(
        id,
      );
      res.status(200).json(doctor);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (updates.speciality) {
        const speciality = await this.specialityRepository.findAll();
        const validSpeciality = speciality.find(
          s => s.name === updates.speciality
        );
        if (!validSpeciality) {
          throw new ValidationError('Invalid speciality');
        }
        updates.speciality = validSpeciality._id
      }

      if (req.file) {
        updates.profilePicture = `/uploads/doctor-profiles/${req.file.filename}`;
      }

      if (Object.keys(updates).length === 0)
        throw new ValidationError('No updates provided');
      const doctor = await this.updateDoctorProfileUseCase.execute(
        id,
        updates
      );
      res.status(200).json(doctor);
    } catch (error) {
      next(error);
    }
  }
}
