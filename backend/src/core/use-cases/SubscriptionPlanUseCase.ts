import { ISubscriptionPlanUseCase } from '../interfaces/use-cases/ISubscriptionPlanUseCase';
import { SubscriptionPlan } from '../entities/SubscriptionPlan';
import { PatientSubscription } from '../entities/PatientSubscription';
import { ISubscriptionPlanRepository } from '../interfaces/repositories/ISubscriptionPlanRepository';
import { IPatientSubscriptionRepository } from '../interfaces/repositories/IPatientSubscriptionRepository';
import { IPatientRepository } from '../interfaces/repositories/IPatientRepository';
import { IDoctorRepository } from '../interfaces/repositories/IDoctorRepository';
import { StripeService } from '../../infrastructure/services/StripeService';
import { INotificationService } from '../interfaces/services/INotificationService';
import { IEmailService } from '../interfaces/services/IEmailService';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { QueryParams } from '../../types/authTypes';
import moment from 'moment';
import { Notification, NotificationType } from '../entities/Notification';
import logger from '../../utils/logger';

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
    plan: Omit<SubscriptionPlan, '_id' | 'doctorId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<SubscriptionPlan> {
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

    const subscriptionPlan: SubscriptionPlan = {
      ...plan,
      doctorId,
      status: 'pending',
    };

    return this._subscriptionPlanRepository.create(subscriptionPlan);
  }

  async updateDoctorSubscriptionPlan(
    subscriptionPlanId: string,
    doctorId: string,
    planData: Partial<SubscriptionPlan>
  ): Promise<SubscriptionPlan> {
    const plan = await this._subscriptionPlanRepository.findById(subscriptionPlanId);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    if (plan.doctorId !== doctorId) {
      throw new ValidationError('Unauthorized to update this plan');
    }

    const updatedPlan = await this._subscriptionPlanRepository.update(subscriptionPlanId, planData);
    if (!updatedPlan) {
      throw new NotFoundError('Failed to update plan');
    }
    return updatedPlan;
  }

  async getDoctorSubscriptionPlans(
    doctorId: string,
    params?: QueryParams
  ): Promise<{ data: SubscriptionPlan[]; totalItems: number }> {
    return await this._subscriptionPlanRepository.findByDoctor(doctorId, params);
  }

  async getDoctorApprovedPlans(doctorId: string): Promise<SubscriptionPlan[]> {
    return await this._subscriptionPlanRepository.findApprovedByDoctor(doctorId);
  }

  async manageSubscriptionPlanGetAll(params: QueryParams): Promise<{ data: SubscriptionPlan[]; totalItems: number }> {
    return this._subscriptionPlanRepository.findAllWithQuery(params);
  }

  async approveSubscriptionPlan(planId: string): Promise<SubscriptionPlan> {
    const plan = await this._subscriptionPlanRepository.update(planId, { status: 'approved' });
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    const doctor = await this._doctorRepository.findById(plan.doctorId);
    return {
      ...plan,
      doctorName: doctor?.name || 'N/A',
    };
  }

  async rejectSubscriptionPlan(planId: string): Promise<SubscriptionPlan> {
    const plan = await this._subscriptionPlanRepository.update(planId, { status: 'rejected' });
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    const doctor = await this._doctorRepository.findById(plan.doctorId);
    return {
      ...plan,
      doctorName: doctor?.name || 'N/A',
    };
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
    await this._subscriptionPlanRepository.delete(planId);
  }

  async subscribeToPlan(
    patientId: string,
    planId: string,
    price: number
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const plan = await this._subscriptionPlanRepository.findById(planId);
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

    const clientSecret = await this._stripeService.createPaymentIntent(price * 100);
    const paymentIntentId = clientSecret.split('_secret_')[0];

    return { clientSecret, paymentIntentId };
  }

  async confirmSubscription(patientId: string, planId: string, paymentIntentId: string): Promise<PatientSubscription> {
    const plan = await this._subscriptionPlanRepository.findById(planId);
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

    await this._stripeService.confirmPaymentIntent(paymentIntentId);

    const startDate = new Date();
    const endDate = moment(startDate).add(plan.validityDays, 'days').toDate();

    const subscription: PatientSubscription = {
      patientId,
      planId,
      startDate,
      endDate,
      status: 'active',
      price: plan.price,
      appointmentsUsed: 0,
      appointmentsLeft: plan.appointmentCount,
      stripePaymentId: paymentIntentId,
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

    return savedSubscription;
  }

  async cancelSubscription(
    patientId: string,
    subscriptionId: string,
    cancellationReason?: string
  ): Promise<{ refundId: string; cardLast4?: string; amount: number }> {
    const subscription = await this._patientSubscriptionRepository.findById(subscriptionId);
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
        throw new Error(`Failed to process refund: ${(error as Error).message}`);
      }
    }
    await this._patientSubscriptionRepository.update(subscriptionId, {
      status: 'cancelled',
      cancellationReason: cancellationReason || 'Patient requested cancellation',
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
    logger.info('refund details:', refundDetails);
    return refundDetails || { refundId: 'N/A', cardLast4: 'N/A', amount: 0 };
  }

  async getPatientSubscriptions(patientId: string): Promise<PatientSubscription[]> {
    return this._patientSubscriptionRepository.findByPatient(patientId);
  }

  async getPlanSubscriptionCounts(planId: string): Promise<{ active: number; expired: number; cancelled: number }> {
    const subscriptions = await this._patientSubscriptionRepository.findByPlan(planId);
    const counts = {
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
