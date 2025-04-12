import { Request, Response, NextFunction } from 'express';
import { ViewDoctorProfileUseCase } from '../../../core/use-cases/profile/ViewDoctorProfile';
import { UpdateDoctorProfileUseCase } from '../../../core/use-cases/profile/UpdateDoctorProfile';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';

export class DoctorProfileController {
  private viewDoctorProfileUseCase: ViewDoctorProfileUseCase;
  private updateDoctorProfileUseCase: UpdateDoctorProfileUseCase;

  constructor(container: Container) {
    this.viewDoctorProfileUseCase = container.get('ViewDoctorProfileUseCase');
    this.updateDoctorProfileUseCase = container.get(
      'UpdateDoctorProfileUseCase'
    );
  }

  async viewProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const requesterId = (req as any).user.id;
      const doctor = await this.viewDoctorProfileUseCase.execute(
        id,
        requesterId
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
      const requesterId = (req as any).user.id;
      const updates = req.body;

      if (req.file) {
        updates.profilePicture = `/uploads/doctor-profiles/${req.file.filename}`;
      }

      if (Object.keys(updates).length === 0)
        throw new ValidationError('No updates provided');
      const doctor = await this.updateDoctorProfileUseCase.execute(
        id,
        requesterId,
        updates
      );
      res.status(200).json(doctor);
    } catch (error) {
      next(error);
    }
  }
}
