import { Request, Response, NextFunction } from 'express';
import { BookAppointmentUseCase } from '../../../core/use-cases/patient/BookAppointment';
import { GetDoctorAvailabilityUseCase } from '../../../core/use-cases/patient/GetDoctorAvailability';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';

export class PatientController {
  private bookAppointmentUseCase: BookAppointmentUseCase;
  private getDoctorAvailabilityUseCase: GetDoctorAvailabilityUseCase;

  constructor(container: Container) {
    this.bookAppointmentUseCase = container.get('BookAppointmentUseCase');
    this.getDoctorAvailabilityUseCase = container.get(
      'GetDoctorAvailabilityUseCase'
    );
  }

  async getDoctorAvailability(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { doctorId } = req.params;
      const { startDate, endDate } = req.query;
      if (!doctorId || !startDate || !endDate) {
        throw new ValidationError(
          'doctorId, startDate, and endDate are required'
        );
      }
      const availability = await this.getDoctorAvailabilityUseCase.execute(
        doctorId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.status(200).json(availability);
    } catch (error) {
      next(error);
    }
  }

  async bookAppointment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const patientId = (req as any).user.id;
      const { doctorId, date, startTime, endTime } = req.body;
      if (!doctorId || !date || !startTime || !endTime) {
        throw new ValidationError(
          'doctorId, date, startTime, and endTime are required'
        );
      }
      const appointment = await this.bookAppointmentUseCase.execute(
        patientId,
        doctorId,
        new Date(date),
        startTime,
        endTime
      );
      res.status(201).json(appointment);
    } catch (error) {
      next(error);
    }
  }
}
