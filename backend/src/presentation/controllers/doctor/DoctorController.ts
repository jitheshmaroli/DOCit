import { Response, NextFunction } from 'express';
import { SetAvailabilityUseCase } from '../../../core/use-cases/doctor/SetAvailability';
import { GetAvailabilityUseCase } from '../../../core/use-cases/doctor/GetAvailability';
import { Container } from '../../../infrastructure/di/container';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import { CreateSubscriptionPlanUseCase } from '../../../core/use-cases/doctor/CreateSubscriptionPlanUseCase';
import { ISubscriptionPlanRepository } from '../../../core/interfaces/repositories/ISubscriptionPlanRepository';
import { GetDoctorAppointmentsUseCase } from '../../../core/use-cases/doctor/GetDoctorAppointmentUseCase';
import { RemoveSlotUseCase } from '../../../core/use-cases/doctor/RemoveSlotUseCase';
import { UpdateSlotUseCase } from '../../../core/use-cases/doctor/UpdateSlotUseCase';
import { DateUtils } from '../../../utils/DateUtils';
import { ISpecialityRepository } from '../../../core/interfaces/repositories/ISpecialityRepository';
import { CustomRequest } from '../../../types';
import { ManageSubscriptionPlanUseCase } from '../../../core/use-cases/admin/ManageSubscriptionPlanUseCase';
import { QueryParams } from '../../../types/authTypes';

export class DoctorController {
  private setAvailabilityUseCase: SetAvailabilityUseCase;
  private getAvailabilityUseCase: GetAvailabilityUseCase;
  private removeSlotUseCase: RemoveSlotUseCase;
  private updateSlotUseCase: UpdateSlotUseCase;
  private createSubscriptionPlanUseCase: CreateSubscriptionPlanUseCase;
  private getDoctorAppointmentsUseCase: GetDoctorAppointmentsUseCase;
  private manageSubscriptionPlanUseCase: ManageSubscriptionPlanUseCase;
  private subscriptionPlanRepository: ISubscriptionPlanRepository;
  private specialityRepository: ISpecialityRepository;

  constructor(container: Container) {
    this.setAvailabilityUseCase = container.get('SetAvailabilityUseCase');
    this.getAvailabilityUseCase = container.get('GetAvailabilityUseCase');
    this.removeSlotUseCase = container.get('RemoveSlotUseCase');
    this.updateSlotUseCase = container.get('UpdateSlotUseCase');
    this.createSubscriptionPlanUseCase = container.get('CreateSubscriptionPlanUseCase');
    this.getDoctorAppointmentsUseCase = container.get('GetDoctorAppointmentsUseCase');
    this.manageSubscriptionPlanUseCase = container.get('ManageSubscriptionPlanUseCase');
    this.subscriptionPlanRepository = container.get('ISubscriptionPlanRepository');
    this.specialityRepository = container.get('ISpecialityRepository');
  }

  async setAvailability(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError('User ID not found in request');
      }
      const { date, timeSlots } = req.body;
      if (!date || !timeSlots || !Array.isArray(timeSlots)) {
        throw new ValidationError('Date and timeSlots array are required');
      }
      const utcDate = DateUtils.parseToUTC(date);
      const availability = await this.setAvailabilityUseCase.execute(doctorId, utcDate, timeSlots);
      res.status(201).json(availability);
    } catch (error) {
      next(error);
    }
  }

  async getAvailability(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError('User ID not found in request');
      }
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        throw new ValidationError('startDate and endDate are required');
      }
      const utcStartDate = DateUtils.parseToUTC(startDate as string);
      const utcEndDate = DateUtils.parseToUTC(endDate as string);
      const availability = await this.getAvailabilityUseCase.execute(doctorId, utcStartDate, utcEndDate);
      res.status(200).json(availability);
    } catch (error) {
      next(error);
    }
  }

  async removeSlot(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError('User ID not found in request');
      }
      const { availabilityId, slotIndex } = req.body;
      if (!availabilityId || slotIndex === undefined) {
        throw new ValidationError('availabilityId and slotIndex are required');
      }
      const availability = await this.removeSlotUseCase.execute(availabilityId, slotIndex, doctorId);
      if (!availability) {
        res.status(200).json({
          message: 'Slot removed and availability deleted (no slots remain)',
        });
        return;
      }
      res.status(200).json(availability);
    } catch (error) {
      next(error);
    }
  }

  async updateSlot(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError('User ID not found in request');
      }
      const { availabilityId, slotIndex, startTime, endTime } = req.body;
      if (!availabilityId || slotIndex === undefined || !startTime || !endTime) {
        throw new ValidationError('availabilityId, slotIndex, startTime, and endTime are required');
      }
      const availability = await this.updateSlotUseCase.execute(
        availabilityId,
        slotIndex,
        { startTime, endTime },
        doctorId
      );
      if (!availability) throw new NotFoundError('Availability not found');
      res.status(200).json(availability);
    } catch (error) {
      next(error);
    }
  }

  async createSubscriptionPlan(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError('User ID not found in request');
      }
      const { name, description, price, validityDays, appointmentCount } = req.body;

      const plan = await this.createSubscriptionPlanUseCase.execute(doctorId, {
        name,
        description,
        price,
        validityDays,
        appointmentCount,
      });

      res.status(201).json(plan);
    } catch (error) {
      next(error);
    }
  }

  async getAppointments(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError('User ID not found in request');
      }
      const { page = 1, limit = 5 } = req.query;
      const queryParams: QueryParams = {
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
      };

      const result = await this.getDoctorAppointmentsUseCase.execute(doctorId, queryParams);
      res.status(200).json({
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
        throw new ValidationError('User ID not found in request');
      }
      const plans = await this.subscriptionPlanRepository.findByDoctor(doctorId);
      res.status(200).json(plans);
    } catch (error) {
      next(error);
    }
  }

  async updateSubscriptionPlan(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError('User ID not found in request');
      }
      const { id } = req.params;
      const { name, description, price, validityDays, appointmentCount } = req.body;

      const plan = await this.subscriptionPlanRepository.findById(id);
      if (!plan) {
        throw new NotFoundError('Plan not found');
      }
      if (plan.doctorId !== doctorId) {
        throw new ValidationError('Unauthorized to update this plan');
      }

      const updatedPlan = await this.subscriptionPlanRepository.update(id, {
        name,
        description,
        price,
        validityDays,
        appointmentCount,
        status: 'pending',
      });

      res.status(200).json(updatedPlan);
    } catch (error) {
      next(error);
    }
  }

  async deleteSubscriptionPlan(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        throw new ValidationError('User ID not found in request');
      }
      const { id } = req.params;

      await this.manageSubscriptionPlanUseCase.delete(id);
      res.status(200).json({ message: 'Plan deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getAllSpecialities(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const specialities = await this.specialityRepository.findAll();
      res.status(200).json(specialities);
    } catch (error) {
      next(error);
    }
  }
}
