import { NextFunction, Request, Response } from 'express';
import { ManageSubscriptionPlanUseCase } from '../../../core/use-cases/admin/ManageSubscriptionPlanUseCase';
import { Container } from '../../../infrastructure/di/container';
import { GetAllAppointmentsUseCase } from '../../../core/use-cases/admin/GetAllAppointmentsUseCase';
import { CreateDoctorUseCase } from '../../../core/use-cases/admin/CreateDoctor';
import { ListDoctorsUseCase } from '../../../core/use-cases/admin/listDoctors';

export class AdminController {
  private manageSubscriptionPlanUseCase: ManageSubscriptionPlanUseCase;
  private getAllAppointmentsUseCase: GetAllAppointmentsUseCase;
  private createDoctorUseCase: CreateDoctorUseCase;
  private listDoctorsUseCase: ListDoctorsUseCase;

  constructor(container: Container) {
    this.createDoctorUseCase = container.get('CreateDoctorUseCase');
    this.listDoctorsUseCase = container.get('ListDoctorsUseCase');
    this.manageSubscriptionPlanUseCase = container.get(
      'ManageSubscriptionPlanUseCase'
    );
    this.getAllAppointmentsUseCase = container.get('GetAllAppointmentsUseCase');
  }

  async getPendingPlans(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const plans = await this.manageSubscriptionPlanUseCase.getPendingPlans();
      res.status(200).json(plans);
    } catch (error) {
      next(error);
    }
  }

  async approvePlan(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { planId } = req.params;
      await this.manageSubscriptionPlanUseCase.approve(planId);
      res.status(200).json({ message: 'Plan approved' });
    } catch (error) {
      next(error);
    }
  }

  async rejectPlan(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { planId } = req.params;
      await this.manageSubscriptionPlanUseCase.reject(planId);
      res.status(200).json({ message: 'Plan rejected' });
    } catch (error) {
      next(error);
    }
  }

  async getAllAppointments(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const appointments = await this.getAllAppointmentsUseCase.execute();
      res.status(200).json(appointments);
    } catch (error) {
      next(error);
    }
  }
}
