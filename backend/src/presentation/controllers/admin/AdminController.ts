import { Request, Response, NextFunction } from 'express';
import { ManageSubscriptionPlanUseCase } from '../../../core/use-cases/admin/ManageSubscriptionPlanUseCase';
import { Container } from '../../../infrastructure/di/container';
import { GetAllAppointmentsUseCase } from '../../../core/use-cases/admin/GetAllAppointmentsUseCase';
import { CreateDoctorUseCase } from '../../../core/use-cases/admin/CreateDoctorUseCase';
import { AdminCancelAppointmentUseCase } from '../../../core/use-cases/admin/AdminCancelAppointmentUseCase';
import { ListDoctorsUseCase } from '../../../core/use-cases/admin/ListDoctorsUseCase';
import { ValidationError } from '../../../utils/errors';
import { AddSpecialityUseCase } from '../../../core/use-cases/admin/AddSpecialityUseCase';
import { UpdateSpecialityUseCase } from '../../../core/use-cases/admin/UpdateSpecialityUseCase';
import { DeleteSpecialityUseCase } from '../../../core/use-cases/admin/DeleteSpecialityUseCase';
import { GetAdminDashboardStatsUseCase } from '../../../core/use-cases/admin/GetAdminDashboardStatsUseCase';
import { PaginatedResponse, QueryParams } from '../../../types/authTypes';
import { SubscriptionPlan } from '../../../core/entities/SubscriptionPlan';
import { Appointment } from '../../../core/entities/Appointment';
import { Speciality } from '../../../core/entities/Speciality';
import logger from '../../../utils/logger';
import { AdminGetReportsUseCase } from '../../../core/use-cases/admin/AdminGetReportsUseCase';
import { GetSpecialitiesUseCase } from '../../../core/use-cases/admin/GetSpecialityUseCase';
import { GetPatientSubscriptionsUseCase } from '../../../core/use-cases/admin/GetpatientSubscriptions';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';

interface ReportFilter {
  type: 'daily' | 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
}

export class AdminController {
  private manageSubscriptionPlanUseCase: ManageSubscriptionPlanUseCase;
  private getAllAppointmentsUseCase: GetAllAppointmentsUseCase;
  private AdminCancelAppointmentUseCase: AdminCancelAppointmentUseCase;
  private getPatientSubscriptionsUseCase: GetPatientSubscriptionsUseCase;
  private getSpecialitiesUseCase: GetSpecialitiesUseCase;
  private addSpecialityUseCase: AddSpecialityUseCase;
  private updateSpecialityUseCase: UpdateSpecialityUseCase;
  private deleteSpecialityUseCase: DeleteSpecialityUseCase;
  private createDoctorUseCase: CreateDoctorUseCase;
  private listDoctorsUseCase: ListDoctorsUseCase;
  private getAdminDashboardStatsUseCase: GetAdminDashboardStatsUseCase;
  private adminGetReportsUseCase: AdminGetReportsUseCase;

  constructor(container: Container) {
    this.createDoctorUseCase = container.get('CreateDoctorUseCase');
    this.listDoctorsUseCase = container.get('ListDoctorsUseCase');
    this.manageSubscriptionPlanUseCase = container.get('ManageSubscriptionPlanUseCase');
    this.getAllAppointmentsUseCase = container.get('GetAllAppointmentsUseCase');
    this.AdminCancelAppointmentUseCase = container.get('AdminCancelAppointmentUseCase');
    this.getPatientSubscriptionsUseCase = container.get('GetPatientSubscriptionsUseCase');
    this.getSpecialitiesUseCase = container.get('GetSpecialitiesUseCase');
    this.addSpecialityUseCase = container.get('AddSpecialityUseCase');
    this.updateSpecialityUseCase = container.get('UpdateSpecialityUseCase');
    this.deleteSpecialityUseCase = container.get('DeleteSpecialityUseCase');
    this.getAdminDashboardStatsUseCase = container.get('GetAdminDashboardStatsUseCase');
    this.adminGetReportsUseCase = container.get('AdminGetReportsUseCase');
  }

  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await this.getAdminDashboardStatsUseCase.execute();
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
      const reportData = await this.adminGetReportsUseCase.execute({
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
      const { data: plans, totalItems } = await this.manageSubscriptionPlanUseCase.getAllPlansWithQuery(params);
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
      const updatedPlan = await this.manageSubscriptionPlanUseCase.approve(planId);
      res.status(HttpStatusCode.OK).json({ data: updatedPlan, message: ResponseMessages.PLAN_APPROVED });
    } catch (error) {
      console.error('Error approving plan:', error);
      next(error);
    }
  }

  async rejectPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId } = req.params;
      const updatedPlan = await this.manageSubscriptionPlanUseCase.reject(planId);
      res.status(HttpStatusCode.OK).json({ data: updatedPlan, message: ResponseMessages.PLAN_REJECTED });
    } catch (error) {
      console.error('Error rejecting plan:', error);
      next(error);
    }
  }

  async deletePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId } = req.params;
      await this.manageSubscriptionPlanUseCase.delete(planId);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.PLAN_DELETED });
    } catch (error) {
      console.error('Error deleting plan:', error);
      next(error);
    }
  }

  async getAllAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = req.query as QueryParams;
      const { data: appointments, totalItems } = await this.getAllAppointmentsUseCase.executeWithQuery(params);
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
      await this.AdminCancelAppointmentUseCase.execute(appointmentId);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.APPOINTMENT_CANCELLED });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      next(error);
    }
  }

  async getPatientSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subscriptions = await this.getPatientSubscriptionsUseCase.execute();
      res.status(HttpStatusCode.OK).json({ data: subscriptions });
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      next(error);
    }
  }

  async getSpecialities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = req.query as QueryParams;
      const { data: specialities, totalItems } = await this.getSpecialitiesUseCase.executeWithQuery(params);
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
      const speciality = await this.addSpecialityUseCase.execute({ name });
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
      const speciality = await this.updateSpecialityUseCase.execute(id, { name });
      res.status(HttpStatusCode.OK).json(speciality);
    } catch (error) {
      next(error);
    }
  }

  async deleteSpeciality(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await this.deleteSpecialityUseCase.execute(id);
      res.status(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }
}
