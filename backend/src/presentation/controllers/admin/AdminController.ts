import { Request, Response, NextFunction } from 'express';
import { ISubscriptionPlanUseCase } from '../../../core/interfaces/use-cases/ISubscriptionPlanUseCase';
import { Container } from '../../../infrastructure/di/container';
import { IAppointmentUseCase } from '../../../core/interfaces/use-cases/IAppointmentUseCase';
import { ISpecialityUseCase } from '../../../core/interfaces/use-cases/ISpecialityUseCase';
import { IReportUseCase } from '../../../core/interfaces/use-cases/IReportUseCase';
import { IPatientUseCase } from '../../../core/interfaces/use-cases/IPatientUseCase';
import { ValidationError } from '../../../utils/errors';
import { QueryParams } from '../../../types/authTypes';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';

export class AdminController {
  private _subscriptionPlanUseCase: ISubscriptionPlanUseCase;
  private _appointmentUseCase: IAppointmentUseCase;
  private _specialityUseCase: ISpecialityUseCase;
  private _reportUseCase: IReportUseCase;
  private _patientUseCase: IPatientUseCase;

  constructor(container: Container) {
    this._subscriptionPlanUseCase = container.get<ISubscriptionPlanUseCase>('ISubscriptionPlanUseCase');
    this._appointmentUseCase = container.get<IAppointmentUseCase>('IAppointmentUseCase');
    this._specialityUseCase = container.get<ISpecialityUseCase>('ISpecialityUseCase');
    this._reportUseCase = container.get<IReportUseCase>('IReportUseCase');
    this._patientUseCase = container.get<IPatientUseCase>('IPatientUseCase');
  }

  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await this._reportUseCase.getAdminDashboardStats();
      res.status(HttpStatusCode.OK).json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      next(error);
    }
  }

  async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, startDate, endDate } = req.body;
      if (!type || !['daily', 'monthly', 'yearly'].includes(type)) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      if (type === 'daily' && (!startDate || !endDate)) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const reportData = await this._reportUseCase.getAdminReports({
        type,
        startDate,
        endDate,
      });
      res.status(HttpStatusCode.OK).json(reportData);
    } catch (error) {
      next(error);
    }
  }

  async getAllPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = req.query as QueryParams;
      const response = await this._subscriptionPlanUseCase.manageSubscriptionPlanGetAll(params);
      res.status(HttpStatusCode.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async approvePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId } = req.params;
      const updatedPlan = await this._subscriptionPlanUseCase.approveSubscriptionPlan(planId);
      res.status(HttpStatusCode.OK).json({ data: updatedPlan, message: ResponseMessages.PLAN_APPROVED });
    } catch (error) {
      next(error);
    }
  }

  async rejectPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId } = req.params;
      const updatedPlan = await this._subscriptionPlanUseCase.rejectSubscriptionPlan(planId);
      res.status(HttpStatusCode.OK).json({ data: updatedPlan, message: ResponseMessages.PLAN_REJECTED });
    } catch (error) {
      next(error);
    }
  }

  async deletePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId } = req.params;
      await this._subscriptionPlanUseCase.deleteSubscriptionPlan(planId);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.PLAN_DELETED });
    } catch (error) {
      next(error);
    }
  }

  async getAllAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = req.query as QueryParams;
      const { data, totalItems } = await this._appointmentUseCase.getAllAppointments(params);
      const appointmentDTOs = data;
      const { page = 1, limit = 10 } = params;
      const totalPages = Math.ceil(totalItems / limit);

      res.status(HttpStatusCode.OK).json({
        data: appointmentDTOs,
        totalPages,
        currentPage: page,
        totalItems,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { appointmentId } = req.params;
      await this._appointmentUseCase.adminCancelAppointment(appointmentId);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.APPOINTMENT_CANCELLED });
    } catch (error) {
      next(error);
    }
  }

  async getPatientSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId } = req.params;
      if (!patientId) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const subscriptions = await this._patientUseCase.getPatientSubscriptions(patientId);
      res.status(HttpStatusCode.OK).json({ data: subscriptions });
    } catch (error) {
      next(error);
    }
  }

  async getSpecialities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = req.query as QueryParams;
      const response = await this._specialityUseCase.getSpecialitiesWithQuery(params);
      res.status(HttpStatusCode.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async addSpeciality(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { specialityName } = req.body;
      if (!specialityName) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const speciality = await this._specialityUseCase.addSpeciality({ name: specialityName });
      res.status(HttpStatusCode.CREATED).json(speciality);
    } catch (error) {
      next(error);
    }
  }

  async updateSpeciality(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const specialityId = req.params.id;
      const { specialityName } = req.body;
      if (!specialityName) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const speciality = await this._specialityUseCase.updateSpeciality(specialityId, { name: specialityName });
      res.status(HttpStatusCode.OK).json(speciality);
    } catch (error) {
      next(error);
    }
  }

  async deleteSpeciality(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const specialityId = req.params.id;
      await this._specialityUseCase.deleteSpeciality(specialityId);
      res.status(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }
}
