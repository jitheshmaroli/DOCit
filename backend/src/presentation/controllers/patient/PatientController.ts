import { Request, Response, NextFunction } from 'express';
import { SubscribeToPlanUseCase } from '../../../core/use-cases/patient/SubscribeToPlanUseCase';
import { CancelAppointmentUseCase } from '../../../core/use-cases/patient/CancelAppointmentUseCase';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError, NotFoundError } from '../../../utils/errors';
import { IPatientSubscriptionRepository } from '../../../core/interfaces/repositories/IPatientSubscriptionRepository';
import { IAppointmentRepository } from '../../../core/interfaces/repositories/IAppointmentRepository';
import { ISubscriptionPlanRepository } from '../../../core/interfaces/repositories/ISubscriptionPlanRepository';
import { IDoctorRepository } from '../../../core/interfaces/repositories/IDoctorRepository';
import { BookAppointmentUseCase } from '../../../core/use-cases/patient/BookAppointment';
import { GetDoctorAvailabilityUseCase } from '../../../core/use-cases/patient/GetDoctorAvailability';

export class PatientController {
  private bookAppointmentUseCase: BookAppointmentUseCase;
  private getDoctorAvailabilityUseCase: GetDoctorAvailabilityUseCase;
  private subscribeToPlanUseCase: SubscribeToPlanUseCase;
  private cancelAppointmentUseCase: CancelAppointmentUseCase;
  private patientSubscriptionRepository: IPatientSubscriptionRepository;
  private appointmentRepository: IAppointmentRepository;
  private subscriptionPlanRepository: ISubscriptionPlanRepository;
  private doctorRepository: IDoctorRepository;

  constructor(container: Container) {
    this.bookAppointmentUseCase = container.get('BookAppointmentUseCase');
    this.getDoctorAvailabilityUseCase = container.get('GetDoctorAvailabilityUseCase');
    this.subscribeToPlanUseCase = container.get('SubscribeToPlanUseCase');
    this.cancelAppointmentUseCase = container.get('CancelAppointmentUseCase');
    this.patientSubscriptionRepository = container.get('IPatientSubscriptionRepository');
    this.appointmentRepository = container.get('IAppointmentRepository');
    this.subscriptionPlanRepository = container.get('ISubscriptionPlanRepository');
    this.doctorRepository = container.get('IDoctorRepository');
  }

  async getDoctorAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;
      const { startDate, endDate } = req.query;
      if (!doctorId || !startDate || !endDate) {
        throw new ValidationError('doctorId, startDate, and endDate are required');
      }
      const availability = await this.getDoctorAvailabilityUseCase.execute(
        doctorId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.status(200).json(availability || []);
    } catch (error) {
      next(error);
    }
  }

  async bookAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = (req as any).user.id;
      const { doctorId, date, startTime, endTime } = req.body;
      if (!doctorId || !date || !startTime || !endTime) {
        throw new ValidationError('doctorId, date, startTime, and endTime are required');
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

  async subscribeToPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = (req as any).user.id;
      const { planId } = req.body;
      if (!planId) {
        throw new ValidationError('planId is required');
      }
      const subscription = await this.subscribeToPlanUseCase.execute(patientId, planId);
      res.status(201).json(subscription);
    } catch (error) {
      next(error);
    }
  }

  async getSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = (req as any).user.id;
      const subscriptions = await this.patientSubscriptionRepository.findByPatient(patientId);
      res.status(200).json(subscriptions);
    } catch (error) {
      next(error);
    }
  }

  async cancelAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = (req as any).user.id;
      const { appointmentId } = req.params;
      if (!appointmentId) {
        throw new ValidationError('appointmentId is required');
      }
      await this.cancelAppointmentUseCase.execute(appointmentId, patientId);
      res.status(200).json({ message: 'Appointment cancelled' });
    } catch (error) {
      next(error);
    }
  }

  async getDoctorPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;
      if (!doctorId) {
        throw new ValidationError('doctorId is required');
      }
      const plans = await this.subscriptionPlanRepository.findApprovedByDoctor(doctorId);
      res.status(200).json(plans);
    } catch (error) {
      next(error);
    }
  }

  async getDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;
      if (!doctorId) {
        throw new ValidationError('doctorId is required');
      }
      const doctor = await this.doctorRepository.findById(doctorId);
      if (!doctor) {
        throw new NotFoundError('Doctor not found');
      }
      res.status(200).json(doctor);
    } catch (error) {
      next(error);
    }
  }

  async getAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = (req as any).user.id;
      const appointments = await this.appointmentRepository.findByPatient(patientId);
      res.status(200).json(appointments);
    } catch (error) {
      next(error);
    }
  }
}