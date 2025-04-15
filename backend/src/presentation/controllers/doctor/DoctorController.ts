import { Request, Response, NextFunction } from 'express';
import { SetAvailabilityUseCase } from '../../../core/use-cases/doctor/SetAvailability';
import { GetAvailabilityUseCase } from '../../../core/use-cases/doctor/GetAvailability';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';

export class DoctorController {
  private setAvailabilityUseCase: SetAvailabilityUseCase;
  private getAvailabilityUseCase: GetAvailabilityUseCase;

  constructor(container: Container) {
    this.setAvailabilityUseCase = container.get('SetAvailabilityUseCase');
    this.getAvailabilityUseCase = container.get('GetAvailabilityUseCase');
  }

  async setAvailability(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const doctorId = (req as any).user.id;
      const { date, timeSlots } = req.body;
      if (!date || !timeSlots || !Array.isArray(timeSlots)) {
        throw new ValidationError('Date and timeSlots array are required');
      }
      const availability = await this.setAvailabilityUseCase.execute(
        doctorId,
        new Date(date),
        timeSlots
      );
      res.status(201).json(availability);
    } catch (error) {
      next(error);
    }
  }

  async getAvailability(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const doctorId = (req as any).user.id;
      const { startDate, endDate } = req.query;
      console.log('request body:',req.body)
      if (!startDate || !endDate) {
        throw new ValidationError('startDate and endDate are required');
      }
      const availability = await this.getAvailabilityUseCase.execute(
        doctorId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.status(200).json(availability);
    } catch (error) {
      next(error);
    }
  }
}
