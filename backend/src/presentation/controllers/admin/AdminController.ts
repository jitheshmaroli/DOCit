import { Request, Response, NextFunction } from 'express';
import { ISubscriptionPlanUseCase } from '../../../core/interfaces/use-cases/ISubscriptionPlanUseCase';
import { Container } from '../../../infrastructure/di/container';
import { IAppointmentUseCase } from '../../../core/interfaces/use-cases/IAppointmentUseCase';
import { IDoctorUseCase } from '../../../core/interfaces/use-cases/IDoctorUseCase';
import { ISpecialityUseCase } from '../../../core/interfaces/use-cases/ISpecialityUseCase';
import { IReportUseCase } from '../../../core/interfaces/use-cases/IReportUseCase';
import { IPatientUseCase } from '../../../core/interfaces/use-cases/IPatientUseCase';
import { ValidationError } from '../../../utils/errors';
import { PaginatedResponse, QueryParams } from '../../../types/authTypes';
import { SubscriptionPlan } from '../../../core/entities/SubscriptionPlan';
import { Appointment } from '../../../core/entities/Appointment';
import { Speciality } from '../../../core/entities/Speciality';
import logger from '../../../utils/logger';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';

interface ReportFilter {
  type: 'daily' | 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
}

export class AdminController {
  private subscriptionPlanUseCase: ISubscriptionPlanUseCase;
  private appointmentUseCase: IAppointmentUseCase;
  private doctorUseCase: IDoctorUseCase;
  private specialityUseCase: ISpecialityUseCase;
  private reportUseCase: IReportUseCase;
  private patientUseCase: IPatientUseCase;

  constructor(container: Container) {
    this.subscriptionPlanUseCase = container.get<ISubscriptionPlanUseCase>('ISubscriptionPlanUseCase');
    this.appointmentUseCase = container.get<IAppointmentUseCase>('IAppointmentUseCase');
    this.doctorUseCase = container.get<IDoctorUseCase>('IDoctorUseCase');
    this.specialityUseCase = container.get<ISpecialityUseCase>('ISpecialityUseCase');
    this.reportUseCase = container.get<IReportUseCase>('IReportUseCase');
    this.patientUseCase = container.get<IPatientUseCase>('IPatientUseCase');
  }

  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await this.reportUseCase.getAdminDashboardStats();
      res.status(HttpStatusCode.OK).json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      next(error);
    }
  }

  async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, startDate, endDate } = req.body as ReportFilter;
      if (!type || !['daily', 'monthly', 'yearly'].includes(type)) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      if (type === 'daily' && (!startDate || !endDate)) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const reportData = await this.reportUseCase.getAdminReports({
        type,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });
      res.status(HttpStatusCode.OK).json(reportData);
    } catch (error) {
      console.error('Error fetching reports:', error);
      next(error);
    }
  }

  async getAllPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = req.query as QueryParams;
      const { data: plans, totalItems } = await this.subscriptionPlanUseCase.manageSubscriptionPlanGetAll(params);
      const { page = 1, limit = 10 } = params;
      const totalPages = Math.ceil(totalItems / limit);

      res.status(HttpStatusCode.OK).json({
        data: plans,
        totalPages,
        currentPage: page,
        totalItems,
      } as PaginatedResponse<SubscriptionPlan>);
    } catch (error) {
      console.error('Error fetching all plans:', error);
      next(error);
    }
  }

  async approvePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId } = req.params;
      const updatedPlan = await this.subscriptionPlanUseCase.approveSubscriptionPlan(planId);
      res.status(HttpStatusCode.OK).json({ data: updatedPlan, message: ResponseMessages.PLAN_APPROVED });
    } catch (error) {
      console.error('Error approving plan:', error);
      next(error);
    }
  }

  async rejectPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId } = req.params;
      const updatedPlan = await this.subscriptionPlanUseCase.rejectSubscriptionPlan(planId);
      res.status(HttpStatusCode.OK).json({ data: updatedPlan, message: ResponseMessages.PLAN_REJECTED });
    } catch (error) {
      console.error('Error rejecting plan:', error);
      next(error);
    }
  }

  async deletePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId } = req.params;
      await this.subscriptionPlanUseCase.deleteSubscriptionPlan(planId);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.PLAN_DELETED });
    } catch (error) {
      console.error('Error deleting plan:', error);
      next(error);
    }
  }

  async getAllAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = req.query as QueryParams;
      const { data: appointments, totalItems } = await this.appointmentUseCase.getAllAppointments(params);
      const { page = 1, limit = 10 } = params;
      const totalPages = Math.ceil(totalItems / limit);

      res.status(HttpStatusCode.OK).json({
        data: appointments,
        totalPages,
        currentPage: page,
        totalItems,
      } as PaginatedResponse<Appointment>);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      next(error);
    }
  }

  async cancelAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.debug('params:', req.params);
      const { appointmentId } = req.params;
      await this.appointmentUseCase.adminCancelAppointment(appointmentId);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.APPOINTMENT_CANCELLED });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      next(error);
    }
  }

  async getPatientSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subscriptions = await this.patientUseCase.getPatientSubscriptions('');
      res.status(HttpStatusCode.OK).json({ data: subscriptions });
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      next(error);
    }
  }

  async getSpecialities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = req.query as QueryParams;
      const { data: specialities, totalItems } = await this.specialityUseCase.getSpecialitiesWithQuery(params);
      const { page = 1, limit = 10 } = params;
      const totalPages = Math.ceil(totalItems / limit);

      res.status(HttpStatusCode.OK).json({
        data: specialities,
        totalPages,
        currentPage: page,
        totalItems,
      } as PaginatedResponse<Speciality>);
    } catch (error) {
      next(error);
    }
  }

  async addSpeciality(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.body;
      if (!name) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const speciality = await this.specialityUseCase.addSpeciality({ name });
      res.status(HttpStatusCode.CREATED).json(speciality);
    } catch (error) {
      next(error);
    }
  }

  async updateSpeciality(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!name) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const speciality = await this.specialityUseCase.updateSpeciality(id, { name });
      res.status(HttpStatusCode.OK).json(speciality);
    } catch (error) {
      next(error);
    }
  }

  async deleteSpeciality(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await this.specialityUseCase.deleteSpeciality(id);
      res.status(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }
}
