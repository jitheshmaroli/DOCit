import { Request, Response, NextFunction } from 'express';
import { SetAvailabilityUseCase } from '../../../core/use-cases/doctor/SetAvailability';
import { GetAvailabilityUseCase } from '../../../core/use-cases/doctor/GetAvailability';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';
import { CreateSubscriptionPlanUseCase } from '../../../core/use-cases/doctor/CreateSubscriptionPlanUseCase';
import { ISubscriptionPlanRepository } from '../../../core/interfaces/repositories/ISubscriptionPlanRepository';
import { GetDoctorAppointmentsUseCase } from '../../../core/use-cases/doctor/GetDoctorAppointmentUseCase';

export class DoctorController {
  private setAvailabilityUseCase: SetAvailabilityUseCase;
  private getAvailabilityUseCase: GetAvailabilityUseCase;
  private createSubscriptionPlanUseCase: CreateSubscriptionPlanUseCase;
  private getDoctorAppointmentsUseCase : GetDoctorAppointmentsUseCase;
  private subscriptionPlanRepository: ISubscriptionPlanRepository;

  constructor(container: Container) {
    this.setAvailabilityUseCase = container.get('SetAvailabilityUseCase');
    this.getAvailabilityUseCase = container.get('GetAvailabilityUseCase');
    this.createSubscriptionPlanUseCase = container.get('CreateSubscriptionPlanUseCase');
    this.getDoctorAppointmentsUseCase = container.get("GetDoctorAppointmentsUseCase");
    this.subscriptionPlanRepository = container.get('ISubscriptionPlanRepository');
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

  async createSubscriptionPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = (req as any).user.id;
      const { name, description, appointmentCost, duration } = req.body;

      const plan = await this.createSubscriptionPlanUseCase.execute(doctorId, {
        name,
        description,
        appointmentCost,
        duration,
      });

      res.status(201).json(plan);
    } catch (error) {
      next(error);
    }
  }

  async getAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = (req as any).user.id;
      const appointments = await this.getDoctorAppointmentsUseCase.execute(doctorId);
      res.status(200).json(appointments);
    } catch (error) {
      next(error);
    }
  }

  async getSubscriptionPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = (req as any).user.id;
     
      const plans = await this.subscriptionPlanRepository.findByDoctor(doctorId);
      res.status(200).json(plans);
    } catch (error) {
      next(error);
    }
  }
  
}
