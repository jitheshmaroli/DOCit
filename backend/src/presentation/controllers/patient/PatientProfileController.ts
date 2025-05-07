import { Request, Response, NextFunction } from 'express';
import { ViewPatientProfileUseCase } from '../../../core/use-cases/profile/ViewPatientProfile';
import { UpdatePatientProfileUseCase } from '../../../core/use-cases/profile/UpdatePatientProfile';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';
import fs from 'fs';

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

      const patient = await this.updatePatientProfileUseCase.execute(
        id,
        requesterId,
        updates,
        req.file
      );

      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      if (!patient) {
        throw new ValidationError('Failed to update profile');
      }

      res.status(200).json(patient);
    } catch (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }
}
