import { Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';
import { IProfileUseCase } from '../../../core/interfaces/use-cases/IProfileUseCase';
import fs from 'fs';
import { CustomRequest } from '../../../types';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';

export class PatientProfileController {
  private _profileUseCase: IProfileUseCase;

  constructor(container: Container) {
    this._profileUseCase = container.get<IProfileUseCase>('IProfileUseCase');
  }

  async viewProfile(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.params.id;
      const requesterId = req.user?.id;
      if (!requesterId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const patient = await this._profileUseCase.viewPatientProfile(patientId, requesterId);
      res.status(HttpStatusCode.OK).json(patient);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.params.id;
      const requesterId = req.user?.id;
      if (!requesterId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const updates = req.body;

      const patient = await this._profileUseCase.updatePatientProfile(patientId, updates, req.file);

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
