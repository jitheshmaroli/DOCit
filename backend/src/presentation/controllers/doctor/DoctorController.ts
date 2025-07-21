import { Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/di/container';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import { IDoctorUseCase } from '../../../core/interfaces/use-cases/IDoctorUseCase';
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

export class DoctorController {
  private doctorUseCase: IDoctorUseCase;
  private subscriptionPlanUseCase: ISubscriptionPlanUseCase;
  private specialityUseCase: ISpecialityUseCase;
  private reportUseCase: IReportUseCase;
  private appointmentUseCase: IAppointmentUseCase;
  private availabilityUseCase: IAvailabilityUseCase;

  constructor(container: Container) {
    this.doctorUseCase = container.get<IDoctorUseCase>('IDoctorUseCase');
    this.subscriptionPlanUseCase = container.get<ISubscriptionPlanUseCase>('ISubscriptionPlanUseCase');
    this.specialityUseCase = container.get<ISpecialityUseCase>('ISpecialityUseCase');
    this.reportUseCase = container.get<IReportUseCase>('IReportUseCase');
    this.appointmentUseCase = container.get<IAppointmentUseCase>('IAppointmentUseCase');
    this.availabilityUseCase = container.get<IAvailabilityUseCase>('IAvailabilityUseCase');
  }

  async setAvailability(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { date, timeSlots, isRecurring, recurringEndDate, recurringDays, forceCreate = true } = req.body;
      if (!date || !timeSlots || !Array.isArray(timeSlots)) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      if (isRecurring && (!recurringEndDate || !recurringDays || !Array.isArray(recurringDays))) {
        throw new ValidationError('Recurring end date and days are required for recurring slots');
      }
      const utcDate = DateUtils.parseToUTC(date);
      const utcRecurringEndDate = recurringEndDate ? DateUtils.parseToUTC(recurringEndDate) : undefined;
      const result = await this.availabilityUseCase.setAvailability(
        doctorId,
        utcDate,
        timeSlots,
        isRecurring,
        utcRecurringEndDate,
        recurringDays,
        forceCreate
      );
      res.status(HttpStatusCode.CREATED).json({
        availabilities: result.availabilities,
        conflicts: result.conflicts,
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
      const availability = await this.availabilityUseCase.getAvailability(doctorId, utcStartDate, utcEndDate);
      res.status(HttpStatusCode.OK).json(availability);
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
      const { availabilityId, slotIndex } = req.body;
      if (!availabilityId || slotIndex === undefined) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const availability = await this.availabilityUseCase.removeSlot(availabilityId, slotIndex, doctorId);
      if (!availability) {
        res.status(HttpStatusCode.OK).json({
          message: ResponseMessages.PLAN_DELETED,
        });
        return;
      }
      res.status(HttpStatusCode.OK).json(availability);
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
      const { availabilityId, slotIndex, startTime, endTime } = req.body;
      if (!availabilityId || slotIndex === undefined || !startTime || !endTime) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const availability = await this.availabilityUseCase.updateSlot(
        availabilityId,
        slotIndex,
        { startTime, endTime },
        doctorId
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

      const plan = await this.subscriptionPlanUseCase.createSubscriptionPlan(doctorId, {
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

      const result = await this.appointmentUseCase.getDoctorAppointments(doctorId, queryParams);
      res.status(HttpStatusCode.OK).json({
        appointments: result.data,
        totalItems: result.totalItems,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSingleAppointment(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { appointmentId } = req.params;
      if (!appointmentId) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }

      const appointment = await this.appointmentUseCase.getSingleAppointment(doctorId, appointmentId);
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

      const result = await this.appointmentUseCase.getDoctorAndPatientAppointmentsWithQuery(
        doctorId,
        patientId,
        queryParams
      );
      res.status(HttpStatusCode.OK).json({
        appointments: result.data,
        totalItems: result.totalItems,
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
      const plans = await this.subscriptionPlanUseCase.getDoctorSubscriptionPlans(doctorId);
      res.status(HttpStatusCode.OK).json(plans);
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
      const { id } = req.params;
      const { name, description, price, validityDays, appointmentCount } = req.body;

      const updatedPlan = await this.subscriptionPlanUseCase.updateDoctorSubscriptionPlan(id, doctorId, {
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
      const { id } = req.params;

      await this.subscriptionPlanUseCase.deleteSubscriptionPlan(id);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.PLAN_DELETED });
    } catch (error) {
      next(error);
    }
  }

  async getAllSpecialities(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const specialities = await this.specialityUseCase.getAllSpecialities();
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
      const stats = await this.reportUseCase.getDoctorDashboardStats(doctorId);
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
      const { type, startDate, endDate } = req.query;
      const filter = {
        type: type as 'daily' | 'monthly' | 'yearly',
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };
      const reports = await this.reportUseCase.getDoctorReports(doctorId, filter);
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
      const appointment = await this.appointmentUseCase.completeAppointment(doctorId, appointmentId, prescription);
      res.status(HttpStatusCode.OK).json(appointment);
    } catch (error) {
      next(error);
    }
  }
}
