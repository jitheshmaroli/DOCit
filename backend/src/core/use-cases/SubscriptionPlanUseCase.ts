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

export class SubscriptionPlanUseCase implements ISubscriptionPlanUseCase {
  constructor(
    private subscriptionPlanRepository: ISubscriptionPlanRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository,
    private patientRepository: IPatientRepository,
    private doctorRepository: IDoctorRepository,
    private stripeService: StripeService,
    private notificationService: INotificationService,
    private emailService: IEmailService
  ) {}

  async createSubscriptionPlan(
    doctorId: string,
    plan: Omit<SubscriptionPlan, '_id' | 'doctorId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<SubscriptionPlan> {
    const doctor = await this.doctorRepository.findById(doctorId);
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

    const existingPlans: SubscriptionPlan[] = await this.subscriptionPlanRepository.findByDoctor(doctorId);
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

    return this.subscriptionPlanRepository.create(subscriptionPlan);
  }

  async updateDoctorSubscriptionPlan(
    subscriptionPlanId: string,
    doctorId: string,
    planData: Partial<SubscriptionPlan>
  ): Promise<SubscriptionPlan> {
    const plan = await this.subscriptionPlanRepository.findById(subscriptionPlanId);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    if (plan.doctorId !== doctorId) {
      throw new ValidationError('Unauthorized to update this plan');
    }

    const updatedPlan = await this.subscriptionPlanRepository.update(subscriptionPlanId, planData);
    if (!updatedPlan) {
      throw new NotFoundError('Failed to update plan');
    }
    return updatedPlan;
  }

  async getDoctorSubscriptionPlans(doctorId: string): Promise<SubscriptionPlan[]> {
    return await this.subscriptionPlanRepository.findByDoctor(doctorId);
  }

  async getDoctorApprovedPlans(doctorId: string): Promise<SubscriptionPlan[]> {
    return await this.subscriptionPlanRepository.findApprovedByDoctor(doctorId);
  }

  async manageSubscriptionPlanGetAll(params: QueryParams): Promise<{ data: SubscriptionPlan[]; totalItems: number }> {
    return this.subscriptionPlanRepository.findAllWithQuery(params);
  }

  async approveSubscriptionPlan(planId: string): Promise<SubscriptionPlan> {
    const plan = await this.subscriptionPlanRepository.update(planId, { status: 'approved' });
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    const doctor = await this.doctorRepository.findById(plan.doctorId);
    return {
      ...plan,
      doctorName: doctor?.name || 'N/A',
    };
  }

  async rejectSubscriptionPlan(planId: string): Promise<SubscriptionPlan> {
    const plan = await this.subscriptionPlanRepository.update(planId, { status: 'rejected' });
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    const doctor = await this.doctorRepository.findById(plan.doctorId);
    return {
      ...plan,
      doctorName: doctor?.name || 'N/A',
    };
  }

  async deleteSubscriptionPlan(planId: string): Promise<void> {
    const plan = await this.subscriptionPlanRepository.findById(planId);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }

    const activeSubscriptions = await this.patientSubscriptionRepository.findActiveSubscriptions();
    const isPlanInUse = activeSubscriptions.some((sub) => {
      if (!sub.planId) return false;
      return typeof sub.planId === 'string' ? sub.planId === planId : sub.planId._id?.toString() === planId;
    });

    if (isPlanInUse) {
      throw new ValidationError('Plan is in use by one or more patients and cannot be deleted');
    }
    await this.subscriptionPlanRepository.delete(planId);
  }

  async subscribeToPlan(
    patientId: string,
    planId: string,
    price: number
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const plan = await this.subscriptionPlanRepository.findById(planId);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    if (plan.status !== 'approved') {
      throw new ValidationError('Plan is not approved');
    }

    const existing = await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, plan.doctorId);
    if (existing) {
      throw new ValidationError('You are already subscribed to a plan for this doctor');
    }

    const clientSecret = await this.stripeService.createPaymentIntent(price * 100);
    const paymentIntentId = clientSecret.split('_secret_')[0];

    return { clientSecret, paymentIntentId };
  }

  async confirmSubscription(patientId: string, planId: string, paymentIntentId: string): Promise<PatientSubscription> {
    const plan = await this.subscriptionPlanRepository.findById(planId);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    if (plan.status !== 'approved') {
      throw new ValidationError('Plan is not approved');
    }

    const existing = await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, plan.doctorId);
    if (existing) {
      throw new ValidationError('You are already subscribed to a plan for this doctor');
    }

    await this.stripeService.confirmPaymentIntent(paymentIntentId);

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

    const savedSubscription = await this.patientSubscriptionRepository.create(subscription);

    const patient = await this.patientRepository.findById(patientId);
    if (!patient) throw new NotFoundError('Patient not found');

    const doctor = await this.doctorRepository.findById(plan.doctorId);
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
      this.notificationService.sendNotification(patientNotification),
      this.notificationService.sendNotification(doctorNotification),
      this.emailService.sendEmail(patient.email, patientEmailSubject, patientEmailText),
      this.emailService.sendEmail(doctor.email, doctorEmailSubject, doctorEmailText),
    ]);

    const activeSubscriptions = await this.patientSubscriptionRepository.findActiveSubscriptions();
    const hasActiveSubscriptions = activeSubscriptions.some((sub) => sub.patientId === patientId);
    await this.patientRepository.updateSubscriptionStatus(patientId, hasActiveSubscriptions);

    return savedSubscription;
  }
}
