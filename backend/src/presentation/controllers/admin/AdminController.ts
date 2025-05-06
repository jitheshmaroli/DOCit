import { Request, Response, NextFunction } from 'express';
import { ManageSubscriptionPlanUseCase } from '../../../core/use-cases/admin/ManageSubscriptionPlanUseCase';
import { Container } from '../../../infrastructure/di/container';
import { GetAllAppointmentsUseCase } from '../../../core/use-cases/admin/GetAllAppointmentsUseCase';
import { CreateDoctorUseCase } from '../../../core/use-cases/admin/CreateDoctorUseCase';
import { CancelAppointmentUseCase } from '../../../core/use-cases/admin/CancelAppointmentUseCase';
import { ListDoctorsUseCase } from '../../../core/use-cases/admin/ListDoctorsUseCase';
import { ValidationError } from '../../../utils/errors';
import { GetSpecialitiesUseCase } from '../../../core/use-cases/admin/GetSpecialityUseCase';
import { AddSpecialityUseCase } from '../../../core/use-cases/admin/AddSpecialityUseCase';
import { UpdateSpecialityUseCase } from '../../../core/use-cases/admin/UpdateSpecialityUseCase';
import { DeleteSpecialityUseCase } from '../../../core/use-cases/admin/DeleteSpecialityUseCase';
import { GetPatientSubscriptionsUseCase } from '../../../core/use-cases/admin/GetpatientSubscriptions';

export class AdminController {
  private manageSubscriptionPlanUseCase: ManageSubscriptionPlanUseCase;
  private getAllAppointmentsUseCase: GetAllAppointmentsUseCase;
  private cancelAppointmentUseCase: CancelAppointmentUseCase;
  private getPatientSubscriptionsUseCase: GetPatientSubscriptionsUseCase;
  private getSpecialitiesUseCase: GetSpecialitiesUseCase;
  private addSpecialityUseCase: AddSpecialityUseCase;
  private updateSpecialityUseCase: UpdateSpecialityUseCase;
  private deleteSpecialityUseCase: DeleteSpecialityUseCase;
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
    this.getPatientSubscriptionsUseCase = container.get(
      'GetPatientSubscriptionsUseCase'
    );
    this.getSpecialitiesUseCase = container.get('GetSpecialitiesUseCase');
    this.addSpecialityUseCase = container.get('AddSpecialityUseCase');
    this.updateSpecialityUseCase = container.get('UpdateSpecialityUseCase');
    this.deleteSpecialityUseCase = container.get('DeleteSpecialityUseCase');
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
      const { appointmentId } = req.params;
      await this.cancelAppointmentUseCase.execute(appointmentId);
      res.status(200).json({ message: 'Appointment cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      next(error);
    }
  }

  async getPatientSubscriptions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const subscriptions = await this.getPatientSubscriptionsUseCase.execute();
      res.status(200).json({ data: subscriptions });
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      next(error);
    }
  }

  async getSpecialities(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const specialities = await this.getSpecialitiesUseCase.execute();
      res.status(200).json({ data: specialities });
    } catch (error) {
      next(error);
    }
  }

  async addSpeciality(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name } = req.body;
      if (!name) throw new ValidationError('Speciality name is required');
      const speciality = await this.addSpecialityUseCase.execute({ name });
      res.status(201).json(speciality);
    } catch (error) {
      next(error);
    }
  }

  async updateSpeciality(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!name) throw new ValidationError('Speciality name is required');
      const speciality = await this.updateSpecialityUseCase.execute(id, {
        name,
      });
      res.status(200).json(speciality);
    } catch (error) {
      next(error);
    }
  }

  async deleteSpeciality(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      await this.deleteSpecialityUseCase.execute(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
