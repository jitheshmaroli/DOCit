import { Response, NextFunction } from 'express';
import { InitiateVideoCallUseCase } from '../../../core/use-cases/video-call/InitiateVideoCallUseCase';
import { EndVideoCallUseCase } from '../../../core/use-cases/video-call/EndVideoCallUseCase';
import { UpdateVideoCallSettingsUseCase } from '../../../core/use-cases/video-call/UpdateVideoCallSettingsUseCase';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';
import { CustomRequest } from '../../../types';
import logger from '../../../utils/logger';

export class VideoCallController {
  private initiateVideoCallUseCase: InitiateVideoCallUseCase;
  private endVideoCallUseCase: EndVideoCallUseCase;
  private updateVideoCallSettingsUseCase: UpdateVideoCallSettingsUseCase;

  constructor(container: Container) {
    this.initiateVideoCallUseCase = container.get('InitiateVideoCallUseCase');
    this.endVideoCallUseCase = container.get('EndVideoCallUseCase');
    this.updateVideoCallSettingsUseCase = container.get('UpdateVideoCallSettingsUseCase');
  }

  async initiateVideoCall(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { appointmentId, patientId, doctorId } = req.body;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      logger.info(`POST /api/video-calls/initiate`, {
        ip: req.ip,
        userId,
        userRole,
        appointmentId,
        patientId,
        doctorId,
      });

      // Validate that user is either the patient or doctor
      //   if (
      //     !userId ||
      //     (userRole === 'patient' && userId !== patientId) ||
      //     (userRole === 'doctor' && userId !== doctorId)
      //   ) {
      //     throw new ValidationError('Unauthorized user for this video call');
      //   }

      const session = await this.initiateVideoCallUseCase.execute(appointmentId, patientId, doctorId);
      res.status(201).json(session);
    } catch (error) {
      next(error);
    }
  }

  async endVideoCall(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User ID not found in request');
      }
      const { sessionId } = req.params;
      await this.endVideoCallUseCase.execute(sessionId, userId);
      res.status(200).json({ message: 'Video call ended' });
    } catch (error) {
      next(error);
    }
  }

  async updateVideoCallSettings(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      if (!userId) {
        throw new ValidationError('User ID not found in request');
      }
      if (userRole !== 'patient' && userRole !== 'doctor') {
        throw new ValidationError('Invalid user role');
      }
      const { sessionId } = req.params;
      const { audio, video } = req.body;
      const settings = await this.updateVideoCallSettingsUseCase.execute(sessionId, userId, userRole, { audio, video });
      res.status(200).json(settings);
    } catch (error) {
      next(error);
    }
  }
}
