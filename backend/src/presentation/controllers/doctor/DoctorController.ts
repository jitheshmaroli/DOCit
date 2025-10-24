import { Response, NextFunction } from 'express';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import { ISubscriptionPlanUseCase } from '../../../core/interfaces/use-cases/ISubscriptionPlanUseCase';
import { ISpecialityUseCase } from '../../../core/interfaces/use-cases/ISpecialityUseCase';
import { IReportUseCase } from '../../../core/interfaces/use-cases/IReportUseCase';
import { IAppointmentUseCase } from '../../../core/interfaces/use-cases/IAppointmentUseCase';
import { DateUtils } from '../../../utils/DateUtils';
import { CustomRequest } from '../../../types';
import { QueryParams } from '../../../types/authTypes';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';
import { IAvailabilityUseCase } from '../../../core/interfaces/use-cases/IAvailabilityUseCase';
import { IPatientUseCase } from '../../../core/interfaces/use-cases/IPatientUseCase';
import logger from '../../../utils/logger';

export class DoctorController {
  constructor(
    private _subscriptionPlanUseCase: ISubscriptionPlanUseCase,
    private _specialityUseCase: ISpecialityUseCase,
    private _reportUseCase: IReportUseCase,
    private _appointmentUseCase: IAppointmentUseCase,
    private _availabilityUseCase: IAvailabilityUseCase,
    private _patientUseCase: IPatientUseCase
  ) {}

  async setAvailability(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { date, timeSlots, isRecurring, recurringEndDate, recurringDays } = req.body;
      if (!date || !timeSlots || !Array.isArray(timeSlots)) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      if (isRecurring && (!recurringEndDate || !recurringDays || !Array.isArray(recurringDays))) {
        throw new ValidationError('Recurring end date and days are required for recurring slots');
      }
      // const utcDate = DateUtils.parseToUTC(date);
      // const utcRecurringEndDate = recurringEndDate ? DateUtils.parseToUTC(recurringEndDate) : undefined;
      const setAvailabilityData = {
        date,
        timeSlots,
        isRecurring,
        recurringEndDate,
        recurringDays,
      };
      const responseData = await this._availabilityUseCase.setAvailability(doctorId, setAvailabilityData);
      res.status(HttpStatusCode.CREATED).json({
        availabilities: responseData.availabilities,
        conflicts: responseData.conflicts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvailability(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const utcStartDate = DateUtils.parseToUTC(startDate as string);
      const utcEndDate = DateUtils.parseToUTC(endDate as string);
      const availabilityData = await this._availabilityUseCase.getAvailability(doctorId, utcStartDate, utcEndDate);
      res.status(HttpStatusCode.OK).json(availabilityData);
    } catch (error) {
      next(error);
    }
  }

  async removeSlot(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { availabilityId, slotId, reason } = req.body;
      if (!availabilityId || slotId === undefined) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const availabilityData = await this._availabilityUseCase.removeSlot(availabilityId, slotId, doctorId, reason);
      if (!availabilityData) {
        res.status(HttpStatusCode.OK).json({
          message: ResponseMessages.PLAN_DELETED,
        });
        return;
      }
      res.status(HttpStatusCode.OK).json(availabilityData);
    } catch (error) {
      next(error);
    }
  }

  async updateSlot(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { availabilityId, slotId, startTime, endTime, reason } = req.body;
      if (!availabilityId || !slotId || !startTime || !endTime) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const newSlot = { startTime, endTime };
      const availability = await this._availabilityUseCase.updateSlot(
        availabilityId,
        slotId,
        newSlot,
        doctorId,
        reason
      );
      if (!availability) throw new NotFoundError(ResponseMessages.NOT_FOUND);
      res.status(HttpStatusCode.OK).json(availability);
    } catch (error) {
      next(error);
    }
  }

  async createSubscriptionPlan(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { name, description, price, validityDays, appointmentCount } = req.body;

      const plan = await this._subscriptionPlanUseCase.createSubscriptionPlan(doctorId, {
        name,
        description,
        price,
        validityDays,
        appointmentCount,
      });

      res.status(HttpStatusCode.CREATED).json(plan);
    } catch (error) {
      next(error);
    }
  }

  async getAppointments(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { page = 1, limit = 5 } = req.query;
      const queryParams: QueryParams = {
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
      };

      const responseData = await this._appointmentUseCase.getDoctorAppointments(doctorId, queryParams);
      res.status(HttpStatusCode.OK).json({
        appointments: responseData.data,
        totalItems: responseData.totalItems,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSingleAppointment(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { appointmentId } = req.params;
      if (!appointmentId) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }

      const appointment = await this._appointmentUseCase.getSingleAppointment(appointmentId);
      res.status(HttpStatusCode.OK).json(appointment);
    } catch (error) {
      next(error);
    }
  }

  async getPatientAppointments(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { patientId } = req.params;
      const { page = 1, limit = 5 } = req.query;
      const queryParams: QueryParams = {
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
      };

      const responseData = await this._appointmentUseCase.getDoctorAndPatientAppointmentsWithQuery({
        doctorId,
        patientId,
        queryParams,
      });
      res.status(HttpStatusCode.OK).json({
        appointments: responseData.data,
        totalItems: responseData.totalItems,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSubscriptionPlans(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { page = 1, limit = 5 } = req.query;
      const queryParams: QueryParams = {
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
      };
      const plans = await this._subscriptionPlanUseCase.getDoctorSubscriptionPlans(doctorId, queryParams);
      res.status(HttpStatusCode.OK).json({
        data: plans.data,
        totalItems: plans.totalItems,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSubscriptionPlan(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { planId } = req.params;
      const { name, description, price, validityDays, appointmentCount } = req.body;

      const updatedPlan = await this._subscriptionPlanUseCase.updateDoctorSubscriptionPlan(planId, doctorId, {
        name,
        description,
        price,
        validityDays,
        appointmentCount,
        status: 'pending',
      });

      res.status(HttpStatusCode.OK).json(updatedPlan);
    } catch (error) {
      next(error);
    }
  }

  async deleteSubscriptionPlan(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { planId } = req.params;

      await this._subscriptionPlanUseCase.deleteSubscriptionPlan(planId);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.PLAN_DELETED });
    } catch (error) {
      next(error);
    }
  }

  async getAllSpecialities(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const specialities = await this._specialityUseCase.getAllSpecialities();
      res.status(HttpStatusCode.OK).json(specialities);
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const query = req.query as QueryParams;
      const stats = await this._reportUseCase.getDoctorDashboardStats(doctorId, query);
      logger.debug(stats);
      res.status(HttpStatusCode.OK).json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getReports(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { type, startDate, endDate } = req.query as {
        type: 'daily' | 'monthly' | 'yearly';
        startDate?: string;
        endDate?: string;
      };
      const filter = {
        type,
        startDate,
        endDate,
      };
      const reports = await this._reportUseCase.getDoctorReports(doctorId, filter);
      logger.debug(reports);
      res.status(HttpStatusCode.OK).json(reports);
    } catch (error) {
      next(error);
    }
  }

  async completeAppointment(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { appointmentId, prescription } = req.body;
      if (!appointmentId || !prescription) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const completeAppointmentData = { doctorId, appointmentId, prescription };
      const appointment = await this._appointmentUseCase.completeAppointment(completeAppointmentData);
      res.status(HttpStatusCode.OK).json(appointment);
    } catch (error) {
      next(error);
    }
  }

  async cancelAppointment(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { appointmentId, cancellationReason } = req.body;
      if (!appointmentId) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const cancelAppointmentData = {
        appointmentId,
        doctorId,
        cancellationReason,
      };
      await this._appointmentUseCase.cancelAppointment(cancelAppointmentData);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.APPOINTMENT_CANCELLED });
    } catch (error) {
      next(error);
    }
  }

  async getAppointedPatients(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { page = 1, limit = 10, search = '' } = req.query;
      const params: QueryParams = {
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
        search: String(search),
      };
      const patients = await this._patientUseCase.getAppointedPatients(doctorId, params);
      res.status(HttpStatusCode.OK).json(patients);
    } catch (error) {
      next(error);
    }
  }

  async getSubscribedPatients(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const subscribedPatients = await this._patientUseCase.getSubscribedPatients(doctorId);
      res.status(HttpStatusCode.OK).json(subscribedPatients);
    } catch (error) {
      next(error);
    }
  }

  async getPlanSubscriptionCounts(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { planId } = req.params;
      if (!planId) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }

      const counts = await this._subscriptionPlanUseCase.getPlanSubscriptionCounts(planId);
      res.status(HttpStatusCode.OK).json(counts);
    } catch (error) {
      next(error);
    }
  }
}
