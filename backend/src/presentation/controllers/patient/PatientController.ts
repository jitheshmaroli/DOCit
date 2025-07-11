import { Response, NextFunction } from 'express';
import { SubscribeToPlanUseCase } from '../../../core/use-cases/patient/SubscribeToPlanUseCase';
import { ConfirmSubscriptionUseCase } from '../../../core/use-cases/patient/ConfirmSubscriptionUseCase';
import { CancelAppointmentUseCase } from '../../../core/use-cases/patient/CancelAppointmentUseCase';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';
import { BookAppointmentUseCase } from '../../../core/use-cases/patient/BookAppointment';
import { GetDoctorAvailabilityUseCase } from '../../../core/use-cases/patient/GetDoctorAvailability';
import { CheckFreeBookingUseCase } from '../../../core/use-cases/patient/CheckFreeBookingUseCase';
import { GetDoctorUseCase } from '../../../core/use-cases/patient/GetDoctorUseCase';
import { GetVerifiedDoctorsUseCase } from '../../../core/use-cases/patient/GetVerifiedDoctorsUseCase';
import { GetAllSpecialitiesUseCase } from '../../../core/use-cases/doctor/GetAllSpecialitiesUseCase';
import { GetPatientSubscriptionsUseCase } from '../../../core/use-cases/patient/GetPatientSubscriptionsUseCase';
import { GetDoctorApprovedPlansUseCase } from '../../../core/use-cases/patient/GetDoctorApprovedPlansUseCase';
import { GetPatientAppointmentsUseCase } from '../../../core/use-cases/patient/GetPatientAppointmentsUseCase';
import { GetAppointmentByIdUseCase } from '../../../core/use-cases/patient/GetAppointmentByIdUseCase';
import mongoose from 'mongoose';
import { CustomRequest } from '../../../types';
import { QueryParams } from '../../../types/authTypes';
import logger from '../../../utils/logger';
import { Appointment } from '../../../core/entities/Appointment';
import { GetPatientActiveSubscriptionUseCase } from '../../../core/use-cases/patient/GetPatientActiveSubscriptionUseCase';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';
import { CreateReviewUseCase } from '../../../core/use-cases/review/CreateReviewUseCase';
import sanitizeHtml from 'sanitize-html';
import { GetDoctorReviewsUseCase } from '../../../core/use-cases/review/GetDoctorReviewsUseCase';

export class PatientController {
  private bookAppointmentUseCase: BookAppointmentUseCase;
  private getDoctorAvailabilityUseCase: GetDoctorAvailabilityUseCase;
  private subscribeToPlanUseCase: SubscribeToPlanUseCase;
  private confirmSubscriptionUseCase: ConfirmSubscriptionUseCase;
  private cancelAppointmentUseCase: CancelAppointmentUseCase;
  private checkFreeBookingUseCase: CheckFreeBookingUseCase;
  private getDoctorUseCase: GetDoctorUseCase;
  private getVerifiedDoctorsUseCase: GetVerifiedDoctorsUseCase;
  private getAllSpecialitiesUseCase: GetAllSpecialitiesUseCase;
  private getPatientActiveSubscriptionUseCase: GetPatientActiveSubscriptionUseCase;
  private getPatientSubscriptionsUseCase: GetPatientSubscriptionsUseCase;
  private getDoctorApprovedPlansUseCase: GetDoctorApprovedPlansUseCase;
  private getPatientAppointmentsUseCase: GetPatientAppointmentsUseCase;
  private getAppointmentByIdUseCase: GetAppointmentByIdUseCase;
  private createReviewUseCase: CreateReviewUseCase;
  private getDoctorReviewsUseCase: GetDoctorReviewsUseCase;

  constructor(container: Container) {
    this.bookAppointmentUseCase = container.get('BookAppointmentUseCase');
    this.getDoctorAvailabilityUseCase = container.get('GetDoctorAvailabilityUseCase');
    this.subscribeToPlanUseCase = container.get('SubscribeToPlanUseCase');
    this.confirmSubscriptionUseCase = container.get('ConfirmSubscriptionUseCase');
    this.cancelAppointmentUseCase = container.get('CancelAppointmentUseCase');
    this.checkFreeBookingUseCase = container.get('CheckFreeBookingUseCase');
    this.getDoctorUseCase = container.get('GetDoctorUseCase');
    this.getVerifiedDoctorsUseCase = container.get('GetVerifiedDoctorsUseCase');
    this.getAllSpecialitiesUseCase = container.get('GetAllSpecialitiesUseCase');
    this.getPatientActiveSubscriptionUseCase = container.get('GetPatientActiveSubscriptionUseCase');
    this.getPatientSubscriptionsUseCase = container.get('GetPatientSubscriptionsUseCase');
    this.getDoctorApprovedPlansUseCase = container.get('GetDoctorApprovedPlansUseCase');
    this.getPatientAppointmentsUseCase = container.get('GetPatientAppointmentsUseCase');
    this.getAppointmentByIdUseCase = container.get('GetAppointmentByIdUseCase');
    this.createReviewUseCase = container.get('CreateReviewUseCase');
    this.getDoctorReviewsUseCase = container.get('GetDoctorReviewsUseCase');
  }

  async getDoctorAvailability(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;
      const date = req.query.startDate;
      if (!doctorId || !date) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const startDate = new Date(date as string);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 30);
      logger.debug('paramsavailability:', req.params);
      logger.debug('paramsavailability:', req.query);
      const availability = await this.getDoctorAvailabilityUseCase.execute(doctorId, startDate, endDate, true);
      res.status(HttpStatusCode.OK).json(availability || []);
    } catch (error) {
      next(error);
    }
  }

  async bookAppointment(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user?.id;
      if (!patientId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { doctorId, date, startTime, endTime, isFreeBooking } = req.body;
      if (!doctorId || !date || !startTime || !endTime) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
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
      res.status(HttpStatusCode.CREATED).json(appointment);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ message: error.message });
        return;
      }
      next(error);
    }
  }

  async getActiveSubscription(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user?.id;
      if (!patientId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { doctorId } = req.params;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const subscription = await this.getPatientActiveSubscriptionUseCase.execute(patientId, doctorId);
      res.status(HttpStatusCode.OK).json(subscription || null);
    } catch (error) {
      next(error);
    }
  }

  async subscribeToPlan(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user?.id;
      if (!patientId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { planId, price } = req.body;
      if (!planId || !price) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const result = await this.subscribeToPlanUseCase.execute(patientId, planId, price);
      res.status(HttpStatusCode.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  }

  async confirmSubscription(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user?.id;
      if (!patientId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { planId, paymentIntentId } = req.body;
      if (!planId || !paymentIntentId) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const subscription = await this.confirmSubscriptionUseCase.execute(patientId, planId, paymentIntentId);
      res.status(HttpStatusCode.CREATED).json(subscription);
    } catch (error) {
      next(error);
    }
  }

  async getSubscriptions(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user?.id;
      if (!patientId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const subscriptions = await this.getPatientSubscriptionsUseCase.execute(patientId);
      res.status(HttpStatusCode.OK).json(subscriptions);
    } catch (error) {
      next(error);
    }
  }

  async cancelAppointment(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user?.id;
      if (!patientId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { appointmentId } = req.params;
      const { cancellationReason } = req.body;
      if (!appointmentId) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      await this.cancelAppointmentUseCase.execute(appointmentId, patientId, cancellationReason);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.APPOINTMENT_CANCELLED });
    } catch (error) {
      next(error);
    }
  }

  async getDoctorPlans(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const plans = await this.getDoctorApprovedPlansUseCase.execute(doctorId);
      res.status(HttpStatusCode.OK).json(plans);
    } catch (error) {
      next(error);
    }
  }

  async getDoctor(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(doctorId)) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ message: ResponseMessages.BAD_REQUEST });
        return;
      }

      const doctor = await this.getDoctorUseCase.execute(doctorId);
      if (!doctor) {
        res.status(HttpStatusCode.NOT_FOUND).json({ message: ResponseMessages.NOT_FOUND });
        return;
      }

      res.status(HttpStatusCode.OK).json(doctor);
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
        minRating: req.query.minRating ? parseFloat(String(req.query.minRating)) : undefined,
      };
      const result = await this.getVerifiedDoctorsUseCase.execute(params);
      res.status(HttpStatusCode.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAppointments(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user?.id;
      if (!patientId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { doctorId, page = 1, limit = 5, status } = req.query;
      const queryParams: QueryParams = {
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
        status: status as string | undefined,
        patientId,
      };

      let response: { appointments: Appointment[]; totalItems: number; canBookFree?: boolean };
      if (doctorId) {
        response = await this.getPatientAppointmentsUseCase.executeForDoctor(
          patientId,
          doctorId as string,
          queryParams
        );
        const canBookFree = await this.checkFreeBookingUseCase.execute(patientId, doctorId as string);
        response.canBookFree = canBookFree;
      } else {
        response = await this.getPatientAppointmentsUseCase.execute(patientId, queryParams);
      }

      res.status(HttpStatusCode.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getAppointment(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { appointmentId } = req.params;

      if (!appointmentId) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }

      const appointment = await this.getAppointmentByIdUseCase.execute(appointmentId);
      res.status(HttpStatusCode.OK).json(appointment);
    } catch (error) {
      next(error);
    }
  }

  async getAllSpecialities(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const specialities = await this.getAllSpecialitiesUseCase.execute();
      res.status(HttpStatusCode.OK).json(specialities);
    } catch (error) {
      next(error);
    }
  }

  async createReview(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user?.id;
      if (!patientId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      if (req.user?.role !== 'patient') {
        throw new ValidationError(ResponseMessages.UNAUTHORIZED);
      }

      const { appointmentId, doctorId, rating, comment } = req.body;

      // Syntactic validation
      if (!appointmentId || !doctorId || rating === undefined || !comment) {
        throw new ValidationError(ResponseMessages.MISSING_REQUIRED_FIELDS);
      }

      if (typeof appointmentId !== 'string' || !mongoose.Types.ObjectId.isValid(appointmentId)) {
        throw new ValidationError('Appointment id is not valid');
      }

      if (typeof doctorId !== 'string' || !mongoose.Types.ObjectId.isValid(doctorId)) {
        throw new ValidationError('Doctor id is not valid');
      }

      if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new ValidationError('Rating must be number and between 1 to 5');
      }

      if (typeof comment !== 'string' || comment.trim() === '' || comment.length > 1000) {
        throw new ValidationError('Invalid comment');
      }

      // Sanitize comment to prevent XSS
      const sanitizedComment = sanitizeHtml(comment, {
        allowedTags: [],
        allowedAttributes: {},
      });

      // Execute use case
      const review = await this.createReviewUseCase.execute(
        patientId,
        doctorId,
        appointmentId,
        rating,
        sanitizedComment
      );

      res.status(HttpStatusCode.CREATED).json({
        success: true,
        data: review,
        message: 'Review created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getDoctorReviews(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;
      if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
        throw new ValidationError('Invalid doctor ID');
      }

      const reviews = await this.getDoctorReviewsUseCase.execute(doctorId);
      res.status(HttpStatusCode.OK).json(reviews);
    } catch (error) {
      next(error);
    }
  }
}
