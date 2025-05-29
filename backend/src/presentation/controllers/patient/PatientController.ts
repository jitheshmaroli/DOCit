import { Response, NextFunction } from 'express';
import { SubscribeToPlanUseCase } from '../../../core/use-cases/patient/SubscribeToPlanUseCase';
import { ConfirmSubscriptionUseCase } from '../../../core/use-cases/patient/ConfirmSubscriptionUseCase';
import { CancelAppointmentUseCase } from '../../../core/use-cases/patient/CancelAppointmentUseCase';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';
import { IPatientSubscriptionRepository } from '../../../core/interfaces/repositories/IPatientSubscriptionRepository';
import { IAppointmentRepository } from '../../../core/interfaces/repositories/IAppointmentRepository';
import { ISubscriptionPlanRepository } from '../../../core/interfaces/repositories/ISubscriptionPlanRepository';
import { BookAppointmentUseCase } from '../../../core/use-cases/patient/BookAppointment';
import { GetDoctorAvailabilityUseCase } from '../../../core/use-cases/patient/GetDoctorAvailability';
import { CheckFreeBookingUseCase } from '../../../core/use-cases/patient/CheckFreeBookingUseCase';
import mongoose from 'mongoose';
import { GetDoctorUseCase } from '../../../core/use-cases/patient/GetDoctorUseCase';
import { GetVerifiedDoctorsUseCase } from '../../../core/use-cases/patient/GetVerifiedDoctorsUseCase';
import { ISpecialityRepository } from '../../../core/interfaces/repositories/ISpecialityRepository';
import { Appointment } from '../../../core/entities/Appointment';
import { CustomRequest } from '../../../types';
import { QueryParams } from '../../../types/authTypes';
import logger from '../../../utils/logger';

export class PatientController {
  private bookAppointmentUseCase: BookAppointmentUseCase;
  private getDoctorAvailabilityUseCase: GetDoctorAvailabilityUseCase;
  private subscribeToPlanUseCase: SubscribeToPlanUseCase;
  private confirmSubscriptionUseCase: ConfirmSubscriptionUseCase;
  private cancelAppointmentUseCase: CancelAppointmentUseCase;
  private checkFreeBookingUseCase: CheckFreeBookingUseCase;
  private getDoctorUseCase: GetDoctorUseCase;
  private getVerifiedDoctorsUseCase: GetVerifiedDoctorsUseCase;
  private patientSubscriptionRepository: IPatientSubscriptionRepository;
  private appointmentRepository: IAppointmentRepository;
  private subscriptionPlanRepository: ISubscriptionPlanRepository;
  private specialityRepository: ISpecialityRepository;

  constructor(container: Container) {
    this.bookAppointmentUseCase = container.get('BookAppointmentUseCase');
    this.getDoctorAvailabilityUseCase = container.get('GetDoctorAvailabilityUseCase');
    this.subscribeToPlanUseCase = container.get('SubscribeToPlanUseCase');
    this.confirmSubscriptionUseCase = container.get('ConfirmSubscriptionUseCase');
    this.cancelAppointmentUseCase = container.get('CancelAppointmentUseCase');
    this.checkFreeBookingUseCase = container.get('CheckFreeBookingUseCase');
    this.getDoctorUseCase = container.get('GetDoctorUseCase');
    this.getVerifiedDoctorsUseCase = container.get('GetVerifiedDoctorsUseCase');
    this.patientSubscriptionRepository = container.get('IPatientSubscriptionRepository');
    this.appointmentRepository = container.get('IAppointmentRepository');
    this.subscriptionPlanRepository = container.get('ISubscriptionPlanRepository');
    this.specialityRepository = container.get('ISpecialityRepository');
  }

  async getDoctorAvailability(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;
      const date = req.query.startDate;
      if (!doctorId || !date) {
        throw new ValidationError('doctorId and date are required');
      }
      const startDate = new Date(date as string);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 30);
      logger.debug('paramsavailability:', req.params);
      logger.debug('paramsavailability:', req.query);
      const availability = await this.getDoctorAvailabilityUseCase.execute(doctorId, startDate, endDate, true);
      res.status(200).json(availability || []);
    } catch (error) {
      next(error);
    }
  }

  async bookAppointment(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user?.id;
      if (!patientId) {
        throw new ValidationError('User ID not found in request');
      }
      const { doctorId, date, startTime, endTime, isFreeBooking } = req.body;
      if (!doctorId || !date || !startTime || !endTime) {
        throw new ValidationError('doctorId, date, startTime, and endTime are required');
      }
      if (isFreeBooking) {
        const canBookFree = await this.checkFreeBookingUseCase.execute(patientId, doctorId);
        if (!canBookFree) {
          throw new ValidationError('Not eligible for free booking');
        }
      }
      const appointment = await this.bookAppointmentUseCase.execute(
        patientId,
        doctorId,
        new Date(date),
        startTime,
        endTime,
        isFreeBooking || false
      );
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      next(error);
    }
  }

  async getActiveSubscription(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user?.id;
      if (!patientId) {
        throw new ValidationError('User ID not found in request');
      }
      const { doctorId } = req.params;
      if (!doctorId) {
        throw new ValidationError('doctorId is required');
      }
      const subscription = await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, doctorId);
      res.status(200).json(subscription || null);
    } catch (error) {
      next(error);
    }
  }

  async subscribeToPlan(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user?.id;
      if (!patientId) {
        throw new ValidationError('User ID not found in request');
      }
      const { planId, price } = req.body;
      if (!planId || !price) {
        throw new ValidationError('planId and price are required');
      }
      const result = await this.subscribeToPlanUseCase.execute(patientId, planId, price);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async confirmSubscription(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user?.id;
      if (!patientId) {
        throw new ValidationError('User ID not found in request');
      }
      const { planId, paymentIntentId } = req.body;
      if (!planId || !paymentIntentId) {
        throw new ValidationError('planId and paymentIntentId are required');
      }
      const subscription = await this.confirmSubscriptionUseCase.execute(patientId, planId, paymentIntentId);
      res.status(201).json(subscription);
    } catch (error) {
      next(error);
    }
  }

  async getSubscriptions(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user?.id;
      if (!patientId) {
        throw new ValidationError('User ID not found in request');
      }
      const subscriptions = await this.patientSubscriptionRepository.findByPatient(patientId);
      res.status(200).json(subscriptions);
    } catch (error) {
      next(error);
    }
  }

  async cancelAppointment(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user?.id;
      if (!patientId) {
        throw new ValidationError('User ID not found in request');
      }
      const { appointmentId } = req.params;
      const { cancellationReason } = req.body; // Extract cancellationReason from body
      if (!appointmentId) {
        throw new ValidationError('appointmentId is required');
      }
      await this.cancelAppointmentUseCase.execute(appointmentId, patientId, cancellationReason);
      res.status(200).json({ message: 'Appointment cancelled' });
    } catch (error) {
      next(error);
    }
  }

  async getDoctorPlans(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
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

  async getDoctor(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
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
    } catch (error) {
      next(error);
    }
  }

  async getVerifiedDoctors(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: QueryParams = {
        page: req.query.page ? parseInt(String(req.query.page)) : undefined,
        limit: req.query.limit ? parseInt(String(req.query.limit)) : undefined,
        search: req.query.search as string | undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
        speciality: req.query.speciality as string | undefined,
        experience: req.query.experience as string | undefined,
        availabilityStart: req.query.availabilityStart as string | undefined,
        availabilityEnd: req.query.availabilityEnd as string | undefined,
        gender: req.query.gender as string | undefined,
      };
      const result = await this.getVerifiedDoctorsUseCase.execute(params);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAppointments(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user?.id;
      if (!patientId) {
        throw new ValidationError('User ID not found in request');
      }
      const { doctorId, page = 1, limit = 5, status } = req.query;
      const queryParams: QueryParams = {
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
        status: status as string | undefined,
      };

      let response: { appointments: Appointment[]; totalItems: number; canBookFree?: boolean };
      if (doctorId) {
        const appointmentsResult = await this.appointmentRepository.findByPatientAndDoctorWithQuery(
          patientId,
          doctorId as string,
          queryParams
        );
        response = {
          appointments: appointmentsResult.data,
          totalItems: appointmentsResult.totalItems,
        };
        const canBookFree = await this.checkFreeBookingUseCase.execute(patientId, doctorId as string);
        response.canBookFree = canBookFree;
      } else {
        const appointmentsResult = await this.appointmentRepository.findAllWithQuery({
          ...queryParams,
          patientId,
        });
        response = {
          appointments: appointmentsResult.data,
          totalItems: appointmentsResult.totalItems,
        };
      }

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getAppointment(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user?.id;
      if (!patientId) {
        throw new ValidationError('User ID not found in request');
      }
      const { appointmentId } = req.params;

      if (!appointmentId) {
        throw new ValidationError('Appointment ID not found in request');
      }

      const appointment = await this.appointmentRepository.findById(appointmentId);

      if (!appointment) {
        throw new ValidationError('No appointment found');
      }
      res.status(200).json(appointment);
    } catch (error) {
      next(error);
    }
  }

  async getAllSpecialities(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const specialities = await this.specialityRepository.findAll();
      res.status(200).json(specialities);
    } catch (error) {
      next(error);
    }
  }
}
