import { ISubscriptionPlanUseCase } from '../../core/interfaces/use-cases/ISubscriptionPlanUseCase';
import { PatientSubscription } from '../../core/entities/PatientSubscription';
import { ISubscriptionPlanRepository } from '../../core/interfaces/repositories/ISubscriptionPlanRepository';
import { IPatientSubscriptionRepository } from '../../core/interfaces/repositories/IPatientSubscriptionRepository';
import { IPatientRepository } from '../../core/interfaces/repositories/IPatientRepository';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { StripeService } from '../../infrastructure/services/StripeService';
import { INotificationService } from '../../core/interfaces/services/INotificationService';
import { IEmailService } from '../../core/interfaces/services/IEmailService';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { QueryParams } from '../../types/authTypes';
import moment from 'moment';
import { Notification, NotificationType } from '../../core/entities/Notification';
import logger from '../../utils/logger';
import {
  CreateSubscriptionPlanRequestDTO,
  UpdateSubscriptionPlanRequestDTO,
  SubscribeToPlanRequestDTO,
  ConfirmSubscriptionRequestDTO,
  CancelSubscriptionRequestDTO,
  SubscriptionPlanResponseDTO,
  PatientSubscriptionResponseDTO,
  PaginatedSubscriptionPlanResponseDTO,
  PlanSubscriptionCountsResponseDTO,
  CancelSubscriptionResponseDTO,
} from '../dtos/SubscriptionPlanDTOs';
import { SubscriptionPlanMapper } from '../mappers/SubscriptionPlanMapper';
import { PatientSubscriptionMapper } from '../mappers/PatientSubscriptionMapper';

export class SubscriptionPlanUseCase implements ISubscriptionPlanUseCase {
  constructor(
    private _subscriptionPlanRepository: ISubscriptionPlanRepository,
    private _patientSubscriptionRepository: IPatientSubscriptionRepository,
    private _patientRepository: IPatientRepository,
    private _doctorRepository: IDoctorRepository,
    private _stripeService: StripeService,
    private _notificationService: INotificationService,
    private _emailService: IEmailService
  ) {}

  async createSubscriptionPlan(
    doctorId: string,
    plan: CreateSubscriptionPlanRequestDTO
  ): Promise<SubscriptionPlanResponseDTO> {
    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    if (plan.price < 100) {
      throw new ValidationError('Plan price must be at least ₹1');
    }
    if (plan.validityDays < 1) {
      throw new ValidationError('Validity days must be at least 1');
    }
    if (plan.appointmentCount < 1) {
      throw new ValidationError('Appointment count must be at least 1');
    }

    const { data: existingPlans } = await this._subscriptionPlanRepository.findByDoctor(doctorId);
    existingPlans.forEach((existingPlan) => {
      if (existingPlan.appointmentCount === plan.appointmentCount && existingPlan.name === plan.name) {
        throw new ValidationError('Plan already exists');
      }
    });

    const subscriptionPlan = SubscriptionPlanMapper.toSubscriptionPlanEntity(plan, doctorId);

    try {
      const createdPlan = await this._subscriptionPlanRepository.create(subscriptionPlan);
      return SubscriptionPlanMapper.toSubscriptionPlanResponseDTO(createdPlan);
    } catch (error) {
      logger.error(`Error creating subscription plan: ${(error as Error).message}`);
      throw new Error('Failed to create subscription plan');
    }
  }

  async updateDoctorSubscriptionPlan(
    subscriptionPlanId: string,
    doctorId: string,
    planData: UpdateSubscriptionPlanRequestDTO
  ): Promise<SubscriptionPlanResponseDTO> {
    const plan = await this._subscriptionPlanRepository.findById(subscriptionPlanId);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    if (plan.doctorId !== doctorId) {
      throw new ValidationError('Unauthorized to update this plan');
    }

    try {
      const updatedPlan = await this._subscriptionPlanRepository.update(subscriptionPlanId, {
        ...planData,
        updatedAt: new Date(),
      });
      if (!updatedPlan) {
        throw new NotFoundError('Failed to update plan');
      }
      return SubscriptionPlanMapper.toSubscriptionPlanResponseDTO(updatedPlan);
    } catch (error) {
      logger.error(`Error updating subscription plan ${subscriptionPlanId}: ${(error as Error).message}`);
      throw new Error('Failed to update subscription plan');
    }
  }

  async getDoctorSubscriptionPlans(
    doctorId: string,
    params?: QueryParams
  ): Promise<PaginatedSubscriptionPlanResponseDTO> {
    const { data, totalItems } = await this._subscriptionPlanRepository.findByDoctor(doctorId, params);
    return SubscriptionPlanMapper.toPaginatedResponseDTO(data, totalItems, params || {});
  }

  async getDoctorApprovedPlans(doctorId: string): Promise<SubscriptionPlanResponseDTO[]> {
    const plans = await this._subscriptionPlanRepository.findApprovedByDoctor(doctorId);
    return plans.map(SubscriptionPlanMapper.toSubscriptionPlanResponseDTO);
  }

  async manageSubscriptionPlanGetAll(params: QueryParams): Promise<PaginatedSubscriptionPlanResponseDTO> {
    const { data, totalItems } = await this._subscriptionPlanRepository.findAllWithQuery(params);
    return SubscriptionPlanMapper.toPaginatedResponseDTO(data, totalItems, params);
  }

  async approveSubscriptionPlan(planId: string): Promise<SubscriptionPlanResponseDTO> {
    const plan = await this._subscriptionPlanRepository.update(planId, { status: 'approved', updatedAt: new Date() });
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    const doctor = await this._doctorRepository.findById(plan.doctorId);
    return SubscriptionPlanMapper.toSubscriptionPlanResponseDTO({
      ...plan,
      doctorName: doctor?.name || 'N/A',
    });
  }

  async rejectSubscriptionPlan(planId: string): Promise<SubscriptionPlanResponseDTO> {
    const plan = await this._subscriptionPlanRepository.update(planId, { status: 'rejected', updatedAt: new Date() });
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    const doctor = await this._doctorRepository.findById(plan.doctorId);
    return SubscriptionPlanMapper.toSubscriptionPlanResponseDTO({
      ...plan,
      doctorName: doctor?.name || 'N/A',
    });
  }

  async deleteSubscriptionPlan(planId: string): Promise<void> {
    const plan = await this._subscriptionPlanRepository.findById(planId);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }

    const activeSubscriptions = await this._patientSubscriptionRepository.findActiveSubscriptions();
    const isPlanInUse = activeSubscriptions.some((sub) => {
      if (!sub.planId) return false;
      return typeof sub.planId === 'string' ? sub.planId === planId : sub.planId === planId;
    });

    if (isPlanInUse) {
      throw new ValidationError('Plan is in use by one or more patients and cannot be deleted');
    }

    try {
      await this._subscriptionPlanRepository.delete(planId);
    } catch (error) {
      logger.error(`Error deleting subscription plan ${planId}: ${(error as Error).message}`);
      throw new Error('Failed to delete subscription plan');
    }
  }

  async subscribeToPlan(
    patientId: string,
    dto: SubscribeToPlanRequestDTO
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const plan = await this._subscriptionPlanRepository.findById(dto.planId);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    if (plan.status !== 'approved') {
      throw new ValidationError('Plan is not approved');
    }

    const existing = await this._patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, plan.doctorId);
    if (existing) {
      throw new ValidationError('You are already subscribed to a plan for this doctor');
    }

    try {
      const clientSecret = await this._stripeService.createPaymentIntent(dto.price * 100);
      const paymentIntentId = clientSecret.split('_secret_')[0];
      return { clientSecret, paymentIntentId };
    } catch (error) {
      logger.error(`Error creating payment intent: ${(error as Error).message}`);
      throw new Error('Failed to create payment intent');
    }
  }

  async confirmSubscription(
    patientId: string,
    dto: ConfirmSubscriptionRequestDTO
  ): Promise<PatientSubscriptionResponseDTO> {
    const plan = await this._subscriptionPlanRepository.findById(dto.planId);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    if (plan.status !== 'approved') {
      throw new ValidationError('Plan is not approved');
    }

    const existing = await this._patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, plan.doctorId);
    if (existing) {
      throw new ValidationError('You are already subscribed to a plan for this doctor');
    }

    try {
      await this._stripeService.confirmPaymentIntent(dto.paymentIntentId);

      const startDate = new Date();
      const endDate = moment(startDate).add(plan.validityDays, 'days').toDate();

      const subscription: PatientSubscription = {
        patientId,
        planId: dto.planId,
        startDate,
        endDate,
        status: 'active',
        price: plan.price,
        appointmentsUsed: 0,
        appointmentsLeft: plan.appointmentCount,
        stripePaymentId: dto.paymentIntentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const savedSubscription = await this._patientSubscriptionRepository.create(subscription);

      const patient = await this._patientRepository.findById(patientId);
      if (!patient) throw new NotFoundError('Patient not found');

      const doctor = await this._doctorRepository.findById(plan.doctorId);
      if (!doctor) throw new NotFoundError('Doctor not found');

      const patientNotification: Notification = {
        userId: patientId,
        type: NotificationType.SUBSCRIPTION_CONFIRMED,
        message: `Your subscription to plan "${plan.name}" with Dr. ${doctor.name} has been confirmed.`,
        isRead: false,
        createdAt: new Date(),
      };

      const doctorNotification: Notification = {
        userId: plan.doctorId,
        type: NotificationType.SUBSCRIPTION_CONFIRMED,
        message: `Your plan "${plan.name}" was subscribed by ${patient.name}.`,
        isRead: false,
        createdAt: new Date(),
      };

      const patientEmailSubject = 'Subscription Confirmation';
      const patientEmailText = `Dear ${patient.name},\n\nYour subscription to the plan "${plan.name}" with Dr. ${doctor.name} has been successfully confirmed. It is valid until ${endDate.toLocaleDateString()} and includes ${plan.appointmentCount} appointments.\n\nBest regards,\nDOCit Team`;
      const doctorEmailSubject = 'New Subscription';
      const doctorEmailText = `Dear Dr. ${doctor.name},\n\n${patient.name} has subscribed to your plan "${plan.name}". The subscription is valid until ${endDate.toLocaleDateString()}.\n\nBest regards,\nDOCit Team`;

      await Promise.all([
        this._notificationService.sendNotification(patientNotification),
        this._notificationService.sendNotification(doctorNotification),
        this._emailService.sendEmail(patient.email, patientEmailSubject, patientEmailText),
        this._emailService.sendEmail(doctor.email, doctorEmailSubject, doctorEmailText),
      ]);

      const activeSubscriptions = await this._patientSubscriptionRepository.findActiveSubscriptions();
      const hasActiveSubscriptions = activeSubscriptions.some((sub) => sub.patientId === patientId);
      await this._patientRepository.updateSubscriptionStatus(patientId, hasActiveSubscriptions);

      return PatientSubscriptionMapper.toDTO(savedSubscription);
    } catch (error) {
      logger.error(`Error confirming subscription: ${(error as Error).message}`);
      throw new Error('Failed to confirm subscription');
    }
  }

  async cancelSubscription(
    patientId: string,
    dto: CancelSubscriptionRequestDTO
  ): Promise<CancelSubscriptionResponseDTO> {
    const subscription = await this._patientSubscriptionRepository.findById(dto.subscriptionId);
    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }
    if (subscription.patientId !== patientId) {
      throw new ValidationError('Unauthorized to cancel this subscription');
    }
    if (subscription.status !== 'active') {
      throw new ValidationError('Subscription is not active');
    }
    if (subscription.appointmentsUsed > 0) {
      throw new ValidationError('Cannot cancel subscription with used appointments');
    }
    if (!subscription.createdAt) {
      throw new ValidationError('Subscription creation date not found');
    }
    const createdAt = moment(subscription.createdAt);
    const now = moment();
    const minutesSinceCreation = now.diff(createdAt, 'minutes');
    if (minutesSinceCreation > 30) {
      throw new ValidationError('Cancellation only allowed within 30 minutes of subscription creation');
    }

    let refundDetails: { refundId: string; cardLast4?: string; amount: number } | null = null;
    if (subscription.stripePaymentId) {
      try {
        refundDetails = await this._stripeService.createRefund(subscription.stripePaymentId);
      } catch (error) {
        logger.error(`Error processing refund: ${(error as Error).message}`);
        throw new Error(`Failed to process refund: ${(error as Error).message}`);
      }
    }

    try {
      await this._patientSubscriptionRepository.update(dto.subscriptionId, {
        status: 'cancelled',
        cancellationReason: dto.cancellationReason || 'Patient requested cancellation',
        updatedAt: new Date(),
      });

      const planId = typeof subscription.planId === 'string' ? subscription.planId : subscription.planId;
      if (!planId) {
        throw new NotFoundError('Plan ID not found');
      }
      const plan = await this._subscriptionPlanRepository.findById(planId);
      const patient = await this._patientRepository.findById(patientId);
      if (patient && plan) {
        await this._notificationService.sendNotification({
          userId: patientId,
          type: NotificationType.SUBSCRIPTION_CANCELLED,
          message: `Subscription to ${plan.name} has been cancelled`,
          createdAt: new Date(),
        });
        await this._emailService.sendEmail(
          patient.email,
          'Subscription Cancelled',
          `Your subscription to ${plan.name} has been cancelled. A refund has been issued.`
        );
      }
      return {
        message: `Subscription ${dto.subscriptionId} cancelled successfully`,
        refundId: refundDetails?.refundId || 'N/A',
        cardLast4: refundDetails?.cardLast4 || 'N/A',
        amount: refundDetails?.amount || 0,
      };
    } catch (error) {
      logger.error(`Error cancelling subscription ${dto.subscriptionId}: ${(error as Error).message}`);
      throw new Error('Failed to cancel subscription');
    }
  }

  async getPatientSubscriptions(patientId: string): Promise<PatientSubscriptionResponseDTO[]> {
    const subscriptions = await this._patientSubscriptionRepository.findByPatient(patientId);
    return subscriptions.map(PatientSubscriptionMapper.toDTO);
  }

  async getPlanSubscriptionCounts(planId: string): Promise<PlanSubscriptionCountsResponseDTO> {
    const subscriptions = await this._patientSubscriptionRepository.findByPlan(planId);
    const counts: PlanSubscriptionCountsResponseDTO = {
      active: 0,
      expired: 0,
      cancelled: 0,
    };

    subscriptions.forEach((sub: PatientSubscription) => {
      if (sub.status === 'active') counts.active++;
      else if (sub.status === 'expired') counts.expired++;
      else if (sub.status === 'cancelled') counts.cancelled++;
    });

    return counts;
  }
}
