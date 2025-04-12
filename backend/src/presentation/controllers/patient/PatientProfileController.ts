import { Request, Response, NextFunction } from 'express';
import { ViewPatientProfileUseCase } from '../../../core/use-cases/profile/ViewPatientProfile';
import { UpdatePatientProfileUseCase } from '../../../core/use-cases/profile/UpdatePatientProfile';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';

export class PatientProfileController {
  private viewPatientProfileUseCase: ViewPatientProfileUseCase;
  private updatePatientProfileUseCase: UpdatePatientProfileUseCase;

  constructor(container: Container) {
    this.viewPatientProfileUseCase = container.get('ViewPatientProfileUseCase');
    this.updatePatientProfileUseCase = container.get(
      'UpdatePatientProfileUseCase'
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
      const patient = await this.viewPatientProfileUseCase.execute(
        id,
        requesterId
      );
      res.status(200).json(patient);
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
        updates.profilePicture = `/uploads/patient-profiles/${req.file.filename}`;
      }

      if (Object.keys(updates).length === 0)
        throw new ValidationError('No updates provided');
      const patient = await this.updatePatientProfileUseCase.execute(
        id,
        requesterId,
        updates
      );
      res.status(200).json(patient);
    } catch (error) {
      next(error);
    }
  }
}
