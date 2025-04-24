import { NextFunction, Request, Response } from 'express';
import { ManageSubscriptionPlanUseCase } from '../../../core/use-cases/admin/ManageSubscriptionPlanUseCase';
import { Container } from '../../../infrastructure/di/container';
import { GetAllAppointmentsUseCase } from '../../../core/use-cases/admin/GetAllAppointmentsUseCase';
import { CreateDoctorUseCase } from '../../../core/use-cases/admin/CreateDoctorUseCase';
import { CancelAppointmentUseCase } from '../../../core/use-cases/admin/CancelAppointmentUseCase';
import { ListDoctorsUseCase } from '../../../core/use-cases/admin/ListDoctorsUseCase';

export class AdminController {
  private manageSubscriptionPlanUseCase: ManageSubscriptionPlanUseCase;
  private getAllAppointmentsUseCase: GetAllAppointmentsUseCase;
  private cancelAppointmentUseCase: CancelAppointmentUseCase;
  private createDoctorUseCase: CreateDoctorUseCase;
  private listDoctorsUseCase: ListDoctorsUseCase;

  constructor(container: Container) {
    this.createDoctorUseCase = container.get('CreateDoctorUseCase');
    this.listDoctorsUseCase = container.get('ListDoctorsUseCase');
    this.manageSubscriptionPlanUseCase = container.get(
      'ManageSubscriptionPlanUseCase'
    );
    this.getAllAppointmentsUseCase = container.get('GetAllAppointmentsUseCase');
    this.cancelAppointmentUseCase = container.get('CancelAppointmentUseCase');
  }

  async getAllPlans(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const plans = await this.manageSubscriptionPlanUseCase.getAllPlans();
      res.status(200).json({ data: plans });
    } catch (error) {
      console.error('Error fetching all plans:', error);
      next(error);
    }
  }

  async getPendingPlans(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const plans = await this.manageSubscriptionPlanUseCase.getPendingPlans();
      res.status(200).json({ data: plans });
    } catch (error) {
      console.error('Error fetching pending plans:', error);
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
      const updatedPlan =
        await this.manageSubscriptionPlanUseCase.approve(planId);
      res.status(200).json({ data: updatedPlan, message: 'Plan approved' });
    } catch (error) {
      console.error('Error approving plan:', error);
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
      const updatedPlan =
        await this.manageSubscriptionPlanUseCase.reject(planId);
      res.status(200).json({ data: updatedPlan, message: 'Plan rejected' });
    } catch (error) {
      console.error('Error rejecting plan:', error);
      next(error);
    }
  }

  async deletePlan(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { planId } = req.params;
      await this.manageSubscriptionPlanUseCase.delete(planId);
      res.status(200).json({ message: 'Plan deleted successfully' });
    } catch (error) {
      console.error('Error deleting plan:', error);
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
      console.log('Sending appointments:', appointments); // Debug
      res.status(200).json({ data: appointments });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      next(error);
    }
  }

  async cancelAppointment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { appointmentId, patientId } = req.params;
      await this.cancelAppointmentUseCase.execute(appointmentId);
      console.log('Cancelled appointment:', appointmentId); // Debug
      res.status(200).json({ message: 'Appointment cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      next(error);
    }
  }
}
