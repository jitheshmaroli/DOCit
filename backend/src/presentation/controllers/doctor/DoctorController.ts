import { Response, NextFunction } from 'express';
import { SetAvailabilityUseCase } from '../../../core/use-cases/doctor/SetAvailability';
import { GetAvailabilityUseCase } from '../../../core/use-cases/doctor/GetAvailability';
import { Container } from '../../../infrastructure/di/container';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import { CreateSubscriptionPlanUseCase } from '../../../core/use-cases/doctor/CreateSubscriptionPlanUseCase';
import { GetDoctorAppointmentsUseCase } from '../../../core/use-cases/doctor/GetDoctorAppointmentUseCase';
import { RemoveSlotUseCase } from '../../../core/use-cases/doctor/RemoveSlotUseCase';
import { UpdateSlotUseCase } from '../../../core/use-cases/doctor/UpdateSlotUseCase';
import { DateUtils } from '../../../utils/DateUtils';
import { CustomRequest } from '../../../types';
import { ManageSubscriptionPlanUseCase } from '../../../core/use-cases/admin/ManageSubscriptionPlanUseCase';
import { QueryParams } from '../../../types/authTypes';
import { GetDashboardStatsUseCase } from '../../../core/use-cases/doctor/GetDashBoardStatsUseCase';
import { DoctorGetReportsUseCase } from '../../../core/use-cases/doctor/DoctorGetReportsUseCase';
import { GetDoctorSubscriptionPlansUseCase } from '../../../core/use-cases/doctor/GetDoctorSubscriptionPlansUseCase';
import { UpdateDoctorSubscriptionPlanUseCase } from '../../../core/use-cases/doctor/UpdateDoctorSubscriptionPlanUseCase';
import { GetAllSpecialitiesUseCase } from '../../../core/use-cases/doctor/GetAllSpecialitiesUseCase';
import { CompleteAppointmentUseCase } from '../../../core/use-cases/doctor/CompleteAppointmentUseCase';
import { GetSingleAppointmentUseCase } from '../../../core/use-cases/doctor/GetSingleAppointmentUseCase';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';

export class DoctorController {
  private setAvailabilityUseCase: SetAvailabilityUseCase;
  private getAvailabilityUseCase: GetAvailabilityUseCase;
  private removeSlotUseCase: RemoveSlotUseCase;
  private updateSlotUseCase: UpdateSlotUseCase;
  private createSubscriptionPlanUseCase: CreateSubscriptionPlanUseCase;
  private getDoctorAppointmentsUseCase: GetDoctorAppointmentsUseCase;
  private manageSubscriptionPlanUseCase: ManageSubscriptionPlanUseCase;
  private getDoctorSubscriptionPlansUseCase: GetDoctorSubscriptionPlansUseCase;
  private updateDoctorSubscriptionPlanUseCase: UpdateDoctorSubscriptionPlanUseCase;
  private getAllSpecialitiesUseCase: GetAllSpecialitiesUseCase;
  private getDashboardStatsUseCase: GetDashboardStatsUseCase;
  private doctorGetReportsUseCase: DoctorGetReportsUseCase;
  private completeAppointmentUseCase: CompleteAppointmentUseCase;
  private getSingleAppointmentUseCase: GetSingleAppointmentUseCase;

  constructor(container: Container) {
    this.setAvailabilityUseCase = container.get('SetAvailabilityUseCase');
    this.getAvailabilityUseCase = container.get('GetAvailabilityUseCase');
    this.removeSlotUseCase = container.get('RemoveSlotUseCase');
    this.updateSlotUseCase = container.get('UpdateSlotUseCase');
    this.createSubscriptionPlanUseCase = container.get('CreateSubscriptionPlanUseCase');
    this.getDoctorAppointmentsUseCase = container.get('GetDoctorAppointmentsUseCase');
    this.manageSubscriptionPlanUseCase = container.get('ManageSubscriptionPlanUseCase');
    this.getDoctorSubscriptionPlansUseCase = container.get('GetDoctorSubscriptionPlansUseCase');
    this.updateDoctorSubscriptionPlanUseCase = container.get('UpdateDoctorSubscriptionPlanUseCase');
    this.getAllSpecialitiesUseCase = container.get('GetAllSpecialitiesUseCase');
    this.getDashboardStatsUseCase = container.get('GetDashboardStatsUseCase');
    this.doctorGetReportsUseCase = container.get('DoctorGetReportsUseCase');
    this.completeAppointmentUseCase = container.get('CompleteAppointmentUseCase');
    this.getSingleAppointmentUseCase = container.get('GetSingleAppointmentUseCase');
  }

  async setAvailability(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { date, timeSlots } = req.body;
      if (!date || !timeSlots || !Array.isArray(timeSlots)) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const utcDate = DateUtils.parseToUTC(date);
      const availability = await this.setAvailabilityUseCase.execute(doctorId, utcDate, timeSlots);
      res.status(HttpStatusCode.CREATED).json(availability);
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
      const availability = await this.getAvailabilityUseCase.execute(doctorId, utcStartDate, utcEndDate);
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
      const availability = await this.removeSlotUseCase.execute(availabilityId, slotIndex, doctorId);
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
      const availability = await this.updateSlotUseCase.execute(
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

      const plan = await this.createSubscriptionPlanUseCase.execute(doctorId, {
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

      const result = await this.getDoctorAppointmentsUseCase.execute(doctorId, queryParams);
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

      const appointment = await this.getSingleAppointmentUseCase.execute(doctorId, appointmentId);
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

      const result = await this.getDoctorAppointmentsUseCase.executeForPatient(doctorId, patientId, queryParams);
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
      const plans = await this.getDoctorSubscriptionPlansUseCase.execute(doctorId);
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

      const updatedPlan = await this.updateDoctorSubscriptionPlanUseCase.execute(id, doctorId, {
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

      await this.manageSubscriptionPlanUseCase.delete(id);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.PLAN_DELETED });
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

  async getDashboardStats(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const stats = await this.getDashboardStatsUseCase.execute(doctorId);
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
      const reports = await this.doctorGetReportsUseCase.execute(doctorId, filter);
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
      const appointment = await this.completeAppointmentUseCase.execute(doctorId, appointmentId, prescription);
      res.status(HttpStatusCode.OK).json(appointment);
    } catch (error) {
      next(error);
    }
  }
}
