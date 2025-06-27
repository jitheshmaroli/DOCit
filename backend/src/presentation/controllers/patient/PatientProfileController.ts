import { Response, NextFunction } from 'express';
import { ViewPatientProfileUseCase } from '../../../core/use-cases/profile/ViewPatientProfile';
import { UpdatePatientProfileUseCase } from '../../../core/use-cases/profile/UpdatePatientProfile';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';
import fs from 'fs';
import { CustomRequest } from '../../../types';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';

export class PatientProfileController {
  private viewPatientProfileUseCase: ViewPatientProfileUseCase;
  private updatePatientProfileUseCase: UpdatePatientProfileUseCase;

  constructor(container: Container) {
    this.viewPatientProfileUseCase = container.get('ViewPatientProfileUseCase');
    this.updatePatientProfileUseCase = container.get('UpdatePatientProfileUseCase');
  }

  async viewProfile(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const requesterId = req.user?.id;
      if (!requesterId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const patient = await this.viewPatientProfileUseCase.execute(id, requesterId);
      res.status(HttpStatusCode.OK).json(patient);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const requesterId = req.user?.id;
      if (!requesterId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const updates = req.body;

      const patient = await this.updatePatientProfileUseCase.execute(id, requesterId, updates, req.file);

      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      if (!patient) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }

      res.status(HttpStatusCode.OK).json(patient);
    } catch (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }
}
