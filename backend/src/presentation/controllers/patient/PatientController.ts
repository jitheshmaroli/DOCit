import { Request, Response, NextFunction } from 'express';
import { SubscribeToPlanUseCase } from '../../../core/use-cases/patient/SubscribeToPlanUseCase';
import { CancelAppointmentUseCase } from '../../../core/use-cases/patient/CancelAppointmentUseCase';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError, NotFoundError } from '../../../utils/errors';
import { IPatientSubscriptionRepository } from '../../../core/interfaces/repositories/IPatientSubscriptionRepository';
import { IAppointmentRepository } from '../../../core/interfaces/repositories/IAppointmentRepository';
import { ISubscriptionPlanRepository } from '../../../core/interfaces/repositories/ISubscriptionPlanRepository';
import { BookAppointmentUseCase } from '../../../core/use-cases/patient/BookAppointment';
import { GetDoctorAvailabilityUseCase } from '../../../core/use-cases/patient/GetDoctorAvailability';
import mongoose from 'mongoose';
import { GetDoctorUseCase } from '../../../core/use-cases/patient/GetDoctorUseCase';
import { GetVerifiedDoctorsUseCase } from '../../../core/use-cases/patient/GetVerifiedDoctorsUseCase';

export class PatientController {
  private bookAppointmentUseCase: BookAppointmentUseCase;
  private getDoctorAvailabilityUseCase: GetDoctorAvailabilityUseCase;
  private subscribeToPlanUseCase: SubscribeToPlanUseCase;
  private cancelAppointmentUseCase: CancelAppointmentUseCase;
  private getDoctorUseCase: GetDoctorUseCase;
  private getVerifiedDoctorsUseCase: GetVerifiedDoctorsUseCase;
  private patientSubscriptionRepository: IPatientSubscriptionRepository;
  private appointmentRepository: IAppointmentRepository;
  private subscriptionPlanRepository: ISubscriptionPlanRepository;

  constructor(container: Container) {
    this.bookAppointmentUseCase = container.get('BookAppointmentUseCase');
    this.getDoctorAvailabilityUseCase = container.get(
      'GetDoctorAvailabilityUseCase'
    );
    this.subscribeToPlanUseCase = container.get('SubscribeToPlanUseCase');
    this.cancelAppointmentUseCase = container.get('CancelAppointmentUseCase');
    this.getDoctorUseCase = container.get('GetDoctorUseCase');
    this.getVerifiedDoctorsUseCase = container.get('GetVerifiedDoctorsUseCase');
    this.patientSubscriptionRepository = container.get(
      'IPatientSubscriptionRepository'
    );
    this.appointmentRepository = container.get('IAppointmentRepository');
    this.subscriptionPlanRepository = container.get(
      'ISubscriptionPlanRepository'
    );
  }

  async getDoctorAvailability(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { doctorId } = req.params;
      const date = req.query.startDate;
      if (!doctorId || !date) {
        throw new ValidationError('doctorId and date are required');
      }
      const startDate = new Date(date as string);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 30);
      const availability = await this.getDoctorAvailabilityUseCase.execute(
        doctorId,
        startDate,
        endDate,
        true // Filter booked slots for patients
      );
      res.status(200).json(availability || []);
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

  async getActiveSubscription(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const patientId = (req as any).user.id;
      const { doctorId } = req.params;
      if (!doctorId) {
        throw new ValidationError('doctorId is required');
      }
      const subscription =
        await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(
          patientId,
          doctorId
        );
      res.status(200).json(subscription || null);
    } catch (error) {
      next(error);
    }
  }

  async subscribeToPlan(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const patientId = (req as any).user.id;
      const { planId } = req.body;
      if (!planId) {
        throw new ValidationError('planId is required');
      }
      const subscription = await this.subscribeToPlanUseCase.execute(
        patientId,
        planId
      );
      res.status(201).json(subscription);
    } catch (error) {
      next(error);
    }
  }

  async getSubscriptions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const patientId = (req as any).user.id;
      const subscriptions =
        await this.patientSubscriptionRepository.findByPatient(patientId);
      res.status(200).json(subscriptions);
    } catch (error) {
      next(error);
    }
  }

  async cancelAppointment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
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

  async getDoctorPlans(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { doctorId } = req.params;
      if (!doctorId) {
        throw new ValidationError('doctorId is required');
      }
      const plans =
        await this.subscriptionPlanRepository.findApprovedByDoctor(doctorId);
      res.status(200).json(plans);
    } catch (error) {
      next(error);
    }
  }

  async getDoctor(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(doctorId)) {
        res.status(400).json({ message: 'Invalid doctor ID' });
        return;
      }

      const doctor = await this.getDoctorUseCase.execute(doctorId);
      if (!doctor) {
        res.status(404).json({ message: 'Doctor not found' });
        return;
      }

      res.status(200).json(doctor);
    } catch (error: any) {
      console.error('Error fetching doctor:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getVerifiedDoctors(req: Request, res: Response): Promise<void> {
    try {
      const doctors = await this.getVerifiedDoctorsUseCase.execute();
      res.status(200).json(doctors);
    } catch (error: any) {
      console.error('Error fetching verified doctors:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getAppointments(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const patientId = (req as any).user.id;
      const { doctorId } = req.query;
      const appointments = doctorId
        ? await this.appointmentRepository.findByPatientAndDoctor(
            patientId,
            doctorId as string
          )
        : await this.appointmentRepository.findByPatient(patientId);
      res.status(200).json(appointments);
    } catch (error) {
      next(error);
    }
  }
}