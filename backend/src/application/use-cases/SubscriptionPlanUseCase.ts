import { ISubscriptionPlanUseCase } from '../../core/interfaces/use-cases/ISubscriptionPlanUseCase';
import { PatientSubscription } from '../../core/entities/PatientSubscription';
import { ISubscriptionPlanRepository } from '../../core/interfaces/repositories/ISubscriptionPlanRepository';
import { IPatientSubscriptionRepository } from '../../core/interfaces/repositories/IPatientSubscriptionRepository';
import { IPatientRepository } from '../../core/interfaces/repositories/IPatientRepository';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { IValidatorService } from '../../core/interfaces/services/IValidatorService';
import { StripeService } from '../../infrastructure/services/StripeService';
import { INotificationService } from '../../core/interfaces/services/INotificationService';
import { IEmailService } from '../../core/interfaces/services/IEmailService';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { QueryParams } from '../../types/authTypes';
import moment from 'moment';
import { Notification, NotificationType } from '../../core/entities/Notification';
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
import logger from '../../utils/logger';
import { ITransactionService } from '../../core/interfaces/services/ITransactionService';

export class SubscriptionPlanUseCase implements ISubscriptionPlanUseCase {
  constructor(
    private _subscriptionPlanRepository: ISubscriptionPlanRepository,
    private _patientSubscriptionRepository: IPatientSubscriptionRepository,
    private _patientRepository: IPatientRepository,
    private _doctorRepository: IDoctorRepository,
    private _stripeService: StripeService,
    private _notificationService: INotificationService,
    private _emailService: IEmailService,
    private _validatorService: IValidatorService,
    private _transactionService: ITransactionService
  ) {}

  async createSubscriptionPlan(
    doctorId: string,
    plan: CreateSubscriptionPlanRequestDTO
  ): Promise<SubscriptionPlanResponseDTO> {
    //validations
    this._validatorService.validateRequiredFields({
      doctorId,
      name: plan.name,
      price: plan.price,
      validityDays: plan.validityDays,
      appointmentCount: plan.appointmentCount,
    });

    this._validatorService.validateIdFormat(doctorId);
    this._validatorService.validateLength(plan.name, 1, 100);
    this._validatorService.validatePositiveNumber(plan.price);
    this._validatorService.validatePositiveInteger(plan.validityDays);
    this._validatorService.validatePositiveInteger(plan.appointmentCount);

    if (plan.price < 100) {
      throw new ValidationError('Plan price must be at least ₹1');
    }
    if (plan.validityDays < 1) {
      throw new ValidationError('Validity days must be at least 1');
    }
    if (plan.appointmentCount < 1) {
      throw new ValidationError('Appointment count must be at least 1');
    }

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    const { data: existingPlans } = await this._subscriptionPlanRepository.findByDoctor(doctorId);
    existingPlans.forEach((existingPlan) => {
      if (existingPlan.appointmentCount === plan.appointmentCount && existingPlan.name === plan.name) {
        throw new ValidationError('Plan already exists');
      }
    });

    const subscriptionPlan = SubscriptionPlanMapper.toSubscriptionPlanEntity(plan, doctorId);

    const createdPlan = await this._subscriptionPlanRepository.create(subscriptionPlan);
    return SubscriptionPlanMapper.toSubscriptionPlanResponseDTO(createdPlan);
  }

  async updateDoctorSubscriptionPlan(
    subscriptionPlanId: string,
    doctorId: string,
    planData: UpdateSubscriptionPlanRequestDTO
  ): Promise<SubscriptionPlanResponseDTO> {
    //validations
    this._validatorService.validateRequiredFields({ subscriptionPlanId, doctorId });
    this._validatorService.validateIdFormat(subscriptionPlanId);
    this._validatorService.validateIdFormat(doctorId);

    if (planData.name) {
      this._validatorService.validateLength(planData.name, 1, 100);
    }
    if (planData.price !== undefined) {
      this._validatorService.validatePositiveNumber(planData.price);
    }
    if (planData.validityDays !== undefined) {
      this._validatorService.validatePositiveInteger(planData.validityDays);
    }
    if (planData.appointmentCount !== undefined) {
      this._validatorService.validatePositiveInteger(planData.appointmentCount);
    }

    const plan = await this._subscriptionPlanRepository.findById(subscriptionPlanId);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    if (plan.doctorId?.toString() !== doctorId) {
      throw new ValidationError('Unauthorized to update this plan');
    }

    const updatedPlan = await this._subscriptionPlanRepository.update(subscriptionPlanId, {
      ...planData,
      updatedAt: new Date(),
    });
    if (!updatedPlan) {
      throw new NotFoundError('Failed to update plan');
    }
    return SubscriptionPlanMapper.toSubscriptionPlanResponseDTO(updatedPlan);
  }

  async getDoctorSubscriptionPlans(
    doctorId: string,
    params?: QueryParams
  ): Promise<PaginatedSubscriptionPlanResponseDTO> {
    this._validatorService.validateRequiredFields({ doctorId });
    this._validatorService.validateIdFormat(doctorId);

    const { data, totalItems } = await this._subscriptionPlanRepository.findByDoctor(doctorId, params);
    return SubscriptionPlanMapper.toPaginatedResponseDTO(data, totalItems, params || {});
  }

  async getDoctorApprovedPlans(doctorId: string): Promise<SubscriptionPlanResponseDTO[]> {
    //validations
    this._validatorService.validateRequiredFields({ doctorId });
    this._validatorService.validateIdFormat(doctorId);

    const plans = await this._subscriptionPlanRepository.findApprovedByDoctor(doctorId);
    return plans.map(SubscriptionPlanMapper.toSubscriptionPlanResponseDTO);
  }

  async manageSubscriptionPlanGetAll(params: QueryParams): Promise<PaginatedSubscriptionPlanResponseDTO> {
    const { data, totalItems } = await this._subscriptionPlanRepository.findAllWithQuery(params);
    return SubscriptionPlanMapper.toPaginatedResponseDTO(data, totalItems, params);
  }

  async approveSubscriptionPlan(planId: string): Promise<SubscriptionPlanResponseDTO> {
    //validations
    this._validatorService.validateRequiredFields({ planId });
    this._validatorService.validateIdFormat(planId);

    const plan = await this._subscriptionPlanRepository.update(planId, { status: 'approved', updatedAt: new Date() });
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    const doctor = await this._doctorRepository.findById(plan.doctorId!);
    return SubscriptionPlanMapper.toSubscriptionPlanResponseDTO({
      ...plan,
      doctorName: doctor?.name || 'N/A',
    });
  }

  async rejectSubscriptionPlan(planId: string): Promise<SubscriptionPlanResponseDTO> {
    //validations
    this._validatorService.validateRequiredFields({ planId });
    this._validatorService.validateIdFormat(planId);

    const plan = await this._subscriptionPlanRepository.update(planId, { status: 'rejected', updatedAt: new Date() });
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    const doctor = await this._doctorRepository.findById(plan.doctorId!);
    return SubscriptionPlanMapper.toSubscriptionPlanResponseDTO({
      ...plan,
      doctorName: doctor?.name || 'N/A',
    });
  }

  async deleteSubscriptionPlan(planId: string): Promise<void> {
    //validations
    this._validatorService.validateRequiredFields({ planId });
    this._validatorService.validateIdFormat(planId);

    const plan = await this._subscriptionPlanRepository.findById(planId);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }

    const activeSubscriptions = await this._patientSubscriptionRepository.findAll();
    const isPlanInUse = activeSubscriptions.some((sub) => {
      if (!sub.planId) return false;
      return sub.status === 'active' && sub.planId.toString() === planId;
    });

    if (isPlanInUse) {
      throw new ValidationError('Plan is in use by one or more patients and cannot be deleted');
    }

    await this._subscriptionPlanRepository.delete(planId);
  }

  async subscribeToPlan(
    patientId: string,
    dto: SubscribeToPlanRequestDTO
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    //validations
    this._validatorService.validateRequiredFields({ patientId, planId: dto.planId, price: dto.price });
    this._validatorService.validateIdFormat(patientId);
    this._validatorService.validateIdFormat(dto.planId);
    this._validatorService.validatePositiveNumber(dto.price);

    const plan = await this._subscriptionPlanRepository.findById(dto.planId);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    if (plan.status !== 'approved') {
      throw new ValidationError('Plan is not approved');
    }

    const existing = await this._patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, plan.doctorId!);
    if (existing) {
      throw new ValidationError('You are already subscribed to a plan for this doctor');
    }

    const clientSecret = await this._stripeService.createPaymentIntent(dto.price * 100);
    const paymentIntentId = clientSecret.split('_secret_')[0];

    const pendingSubscription: PatientSubscription = {
      patientId,
      planId: plan._id,
      startDate: undefined,
      endDate: undefined,
      status: 'pending',
      price: plan.price,
      appointmentsUsed: 0,
      appointmentsLeft: plan.appointmentCount,
      stripePaymentId: paymentIntentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this._validatorService.validateRequiredFields({
      patientId: pendingSubscription.patientId,
      planId: pendingSubscription.planId,
      status: pendingSubscription.status,
      price: pendingSubscription.price,
      appointmentsUsed: pendingSubscription.appointmentsUsed,
      appointmentsLeft: pendingSubscription.appointmentsLeft,
    });
    this._validatorService.validateEnum(pendingSubscription.status, ['pending', 'active', 'expired', 'cancelled']);
    this._validatorService.validatePositiveNumber(Number(pendingSubscription.price));

    await this._patientSubscriptionRepository.create(pendingSubscription);

    return { clientSecret, paymentIntentId };
  }

  async resumePendingSubscription(
    patientId: string,
    subscriptionId: string
  ): Promise<{ clientSecret: string; planId: string; price: number }> {
    this._validatorService.validateRequiredFields({ patientId, subscriptionId });
    this._validatorService.validateIdFormat(patientId);
    this._validatorService.validateIdFormat(subscriptionId);

    const subscription = await this._patientSubscriptionRepository.findById(subscriptionId);
    if (!subscription) {
      throw new NotFoundError('Pending subscription not found');
    }
    if (subscription.patientId?.toString() !== patientId) {
      throw new ValidationError('Unauthorized to access this subscription');
    }
    if (subscription.status !== 'pending') {
      throw new ValidationError('Subscription is not pending');
    }
    if (!subscription.stripePaymentId) {
      throw new ValidationError('No payment intent associated with this subscription');
    }

    const paymentIntent = await this._stripeService.retrievePaymentIntent(subscription.stripePaymentId);

    if (paymentIntent.status === 'succeeded') {
      await this.handlePaymentSuccess(subscription.stripePaymentId);
      const updatedSubscription = await this._patientSubscriptionRepository.findById(subscriptionId);
      if (updatedSubscription?.status === 'active') {
        throw new ValidationError(
          'Subscription has already been paid and activated. Please refresh the page to see the updated status.'
        );
      }
    }

    if (paymentIntent.status !== 'requires_payment_method' && paymentIntent.status !== 'requires_confirmation') {
      throw new ValidationError('Payment intent is not pending and cannot be resumed');
    }

    const plan = await this._subscriptionPlanRepository.findById(subscription.planId!.toString());
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }

    return {
      clientSecret: paymentIntent.client_secret!,
      planId: subscription.planId!.toString(),
      price: plan.price,
    };
  }

  async confirmSubscription(
    patientId: string,
    dto: ConfirmSubscriptionRequestDTO
  ): Promise<PatientSubscriptionResponseDTO> {
    //validations (simplified)
    this._validatorService.validateRequiredFields({
      patientId,
      planId: dto.planId,
      paymentIntentId: dto.paymentIntentId,
    });
    this._validatorService.validateIdFormat(patientId);
    this._validatorService.validateIdFormat(dto.planId);
    this._validatorService.validateLength(dto.paymentIntentId, 1, 100);

    await this._stripeService.retrievePaymentIntent(dto.paymentIntentId);

    const subscription = await this._patientSubscriptionRepository.findByStripePaymentId(dto.paymentIntentId);
    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }
    if (subscription.patientId?.toString() !== patientId) {
      throw new ValidationError('Unauthorized to access this subscription');
    }
    if (subscription.status === 'active') {
      return PatientSubscriptionMapper.toDTO(subscription);
    }

    const plan = await this._subscriptionPlanRepository.findById(dto.planId);
    if (!plan || plan.status !== 'approved') {
      throw new ValidationError('Plan is no longer approved');
    }

    if (subscription.status === 'pending') {
      const maxWaitTime = 30000;
      const checkInterval = 1000;
      let elapsed = 0;

      while (elapsed < maxWaitTime) {
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
        elapsed += checkInterval;

        const updatedSubscription = await this._patientSubscriptionRepository.findByStripePaymentId(
          dto.paymentIntentId
        );
        if (updatedSubscription && updatedSubscription.status === 'active') {
          return PatientSubscriptionMapper.toDTO(updatedSubscription);
        }
      }

      throw new ValidationError(
        'Subscription activation is taking longer than expected. Please check your subscription status in a moment.'
      );
    }

    throw new ValidationError(`Subscription is in unexpected state: ${subscription.status}`);
  }

  async handlePaymentSuccess(paymentIntentId: string): Promise<void> {
    this._validatorService.validateLength(paymentIntentId, 1, 100);

    let subscriptionId: string | undefined;
    let patientId: string | undefined;
    let calculatedEndDate: Date | undefined;

    await this._transactionService.withTransaction(async (session) => {
      const subscription = await this._patientSubscriptionRepository.findByStripePaymentId(paymentIntentId, session);
      if (!subscription) {
        logger.warn(`No pending subscription found for payment intent: ${paymentIntentId}`);
        return;
      }
      if (subscription.status !== 'pending') {
        logger.info(
          `Subscription already processed for payment intent: ${paymentIntentId}, status: ${subscription.status}`
        );
        return;
      }

      const planId = subscription.planId?.toString();
      if (!planId) {
        throw new NotFoundError('Plan ID not found');
      }

      const plan = await this._subscriptionPlanRepository.findById(planId, session);
      if (!plan) {
        throw new NotFoundError('Plan not found');
      }

      const patient = await this._patientRepository.findById(subscription.patientId!.toString(), session);
      if (!patient) throw new NotFoundError('Patient not found');

      const doctor = await this._doctorRepository.findById(plan.doctorId!.toString(), session);
      if (!doctor) throw new NotFoundError('Doctor not found');

      const startDate = new Date();
      const endDate = moment(startDate).add(plan.validityDays, 'days').toDate();

      subscriptionId = subscription._id!.toString();
      patientId = subscription.patientId!.toString();
      calculatedEndDate = endDate;

      // Activate subscription
      const updatedSubscription = await this._patientSubscriptionRepository.update(
        subscription._id!,
        {
          status: 'active',
          startDate,
          endDate,
          updatedAt: new Date(),
        },
        session
      );

      if (!updatedSubscription) {
        throw new ValidationError('Failed to activate subscription');
      }

      // update patient's hasActiveSubscriptions flag
      const hasActiveSubscriptions = await this._patientSubscriptionRepository.hasActiveSubscriptions(
        subscription.patientId!.toString(),
        session
      );
      await this._patientRepository.updateSubscriptionStatus(subscription.patientId!, hasActiveSubscriptions, session);
    });

    if (!subscriptionId || !patientId || !calculatedEndDate) {
      return;
    }

    logger.info(`Subscription ${subscriptionId} activated successfully for payment intent: ${paymentIntentId}`);

    const freshSubscription = await this._patientSubscriptionRepository.findById(subscriptionId);
    if (!freshSubscription || freshSubscription.status !== 'active') {
      logger.warn(`Subscription not active after transaction for ${paymentIntentId}`);
      return;
    }

    const planId = freshSubscription.planId?.toString();
    if (!planId) {
      logger.error('Plan ID missing after activation');
      return;
    }

    const plan = await this._subscriptionPlanRepository.findById(planId);
    const patient = await this._patientRepository.findById(patientId);
    const doctor = await this._doctorRepository.findById(plan!.doctorId!.toString());

    if (!plan || !patient || !doctor) {
      logger.error(`Missing plan/patient/doctor after successful activation for payment intent: ${paymentIntentId}`);
      return;
    }

    // Notifications
    const patientNotification: Notification = {
      userId: patientId,
      type: NotificationType.SUBSCRIPTION_CONFIRMED,
      message: `Your subscription to plan "${plan.name}" with Dr. ${doctor.name} has been confirmed.`,
      isRead: false,
      createdAt: new Date(),
    };

    const doctorNotification: Notification = {
      userId: plan.doctorId!,
      type: NotificationType.SUBSCRIPTION_CONFIRMED,
      message: `Your plan "${plan.name}" was subscribed by ${patient.name}.`,
      isRead: false,
      createdAt: new Date(),
    };

    // Validation
    this._validatorService.validateRequiredFields({
      patientNotificationUserId: patientNotification.userId,
      patientNotificationMessage: patientNotification.message,
      patientNotificationType: patientNotification.type,
      doctorNotificationUserId: doctorNotification.userId,
      doctorNotificationMessage: doctorNotification.message,
      doctorNotificationType: doctorNotification.type,
    });
    this._validatorService.validateIdFormat(patientNotification.userId!);
    // this._validatorService.validateIdFormat(doctorNotification.userId!);
    this._validatorService.validateLength(patientNotification.message, 1, 1000);
    this._validatorService.validateLength(doctorNotification.message, 1, 1000);
    this._validatorService.validateEnum(patientNotification.type, ['SUBSCRIPTION_CONFIRMED', 'SUBSCRIPTION_CANCELLED']);
    this._validatorService.validateEnum(doctorNotification.type, ['SUBSCRIPTION_CONFIRMED', 'SUBSCRIPTION_CANCELLED']);

    // Emails
    const patientEmailSubject = 'Subscription Confirmation';
    const patientEmailText = `Dear ${patient.name},\n\nYour subscription to the plan "${plan.name}" with Dr. ${doctor.name} has been successfully confirmed. It is valid until ${calculatedEndDate.toLocaleDateString()} and includes ${plan.appointmentCount} appointments.\n\nBest regards,\nDOCit Team`;

    const doctorEmailSubject = 'New Subscription';
    const doctorEmailText = `Dear Dr. ${doctor.name},\n\n${patient.name} has subscribed to your plan "${plan.name}". The subscription is valid until ${calculatedEndDate.toLocaleDateString()}.\n\nBest regards,\nDOCit Team`;

    this._validatorService.validateEmailFormat(patient.email);
    this._validatorService.validateEmailFormat(doctor.email);
    this._validatorService.validateLength(patientEmailSubject, 1, 100);
    this._validatorService.validateLength(doctorEmailSubject, 1, 100);
    this._validatorService.validateLength(patientEmailText, 1, 1000);
    this._validatorService.validateLength(doctorEmailText, 1, 1000);

    // Send notifications and emails
    await Promise.all([
      this._notificationService.sendNotification(patientNotification),
      this._notificationService.sendNotification(doctorNotification),
      this._emailService.sendEmail(patient.email, patientEmailSubject, patientEmailText),
      this._emailService.sendEmail(doctor.email, doctorEmailSubject, doctorEmailText),
    ]);
  }

  async cancelSubscription(
    patientId: string,
    dto: CancelSubscriptionRequestDTO
  ): Promise<CancelSubscriptionResponseDTO> {
    this._validatorService.validateRequiredFields({ patientId, subscriptionId: dto.subscriptionId });
    this._validatorService.validateIdFormat(patientId);
    this._validatorService.validateIdFormat(dto.subscriptionId);

    if (dto.cancellationReason) {
      this._validatorService.validateLength(dto.cancellationReason, 1, 500);
    }

    const subscription = await this._patientSubscriptionRepository.findById(dto.subscriptionId);
    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }
    if (subscription.patientId?.toString() !== patientId) {
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
      this._validatorService.validateLength(subscription.stripePaymentId, 1, 100);
      refundDetails = await this._stripeService.createRefund(subscription.stripePaymentId);
    }

    await this._patientSubscriptionRepository.update(dto.subscriptionId, {
      status: 'cancelled',
      cancellationReason: dto.cancellationReason || 'Patient requested cancellation',
      refundId: refundDetails?.refundId || 'N/A',
      refundAmount: refundDetails?.amount || 0,
      updatedAt: new Date(),
    });

    const planId = subscription.planId?.toString();
    if (!planId) {
      throw new NotFoundError('Plan ID not found');
    }
    this._validatorService.validateIdFormat(planId);

    const plan = await this._subscriptionPlanRepository.findById(planId);
    const patient = await this._patientRepository.findById(patientId);
    if (patient && plan) {
      const notification: Notification = {
        userId: patientId,
        type: NotificationType.SUBSCRIPTION_CANCELLED,
        message: `Subscription to ${plan.name} has been cancelled`,
        createdAt: new Date(),
      };

      this._validatorService.validateRequiredFields({
        userId: notification.userId,
        type: notification.type,
        message: notification.message,
      });
      this._validatorService.validateIdFormat(notification.userId!);
      this._validatorService.validateEnum(notification.type, ['SUBSCRIPTION_CONFIRMED', 'SUBSCRIPTION_CANCELLED']);
      this._validatorService.validateLength(notification.message, 1, 1000);

      this._validatorService.validateEmailFormat(patient.email);
      const emailSubject = 'Subscription Cancelled';
      const emailText = `Dear ${patient.name},\n\nYour subscription to ${plan.name} has been cancelled. A refund has been issued.\n\nBest regards,\nDOCit Team`;
      this._validatorService.validateLength(emailSubject, 1, 100);
      this._validatorService.validateLength(emailText, 1, 1000);

      await this._notificationService.sendNotification(notification);
      await this._emailService.sendEmail(patient.email, emailSubject, emailText);
    }
    return {
      message: `Subscription ${dto.subscriptionId} cancelled successfully`,
      refundId: refundDetails?.refundId || 'N/A',
      cardLast4: refundDetails?.cardLast4 || 'N/A',
      amount: refundDetails?.amount || 0,
    };
  }

  async getPatientSubscriptions(patientId: string): Promise<PatientSubscriptionResponseDTO[]> {
    this._validatorService.validateRequiredFields({ patientId });
    this._validatorService.validateIdFormat(patientId);

    const subscriptions = await this._patientSubscriptionRepository.findByPatient(patientId);
    return subscriptions.map(PatientSubscriptionMapper.toDTO);
  }

  async getPlanSubscriptionCounts(planId: string): Promise<PlanSubscriptionCountsResponseDTO> {
    this._validatorService.validateRequiredFields({ planId });
    this._validatorService.validateIdFormat(planId);

    const subscriptions = await this._patientSubscriptionRepository.findByPlan(planId);
    const counts: PlanSubscriptionCountsResponseDTO = {
      active: 0,
      expired: 0,
      cancelled: 0,
    };

    subscriptions.forEach((sub: PatientSubscription) => {
      this._validatorService.validateEnum(sub.status, ['active', 'expired', 'cancelled']);
      if (sub.status === 'active') counts.active++;
      else if (sub.status === 'expired') counts.expired++;
      else if (sub.status === 'cancelled') counts.cancelled++;
    });

    return counts;
  }

  async notifySubscriptionExpiration(subscriptionId: string): Promise<void> {
    const subscription = await this._patientSubscriptionRepository.findById(subscriptionId);
    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }
    if (subscription.status !== 'expired') {
      throw new ValidationError('Subscription is not expired');
    }

    const planId = typeof subscription.planId === 'string' ? subscription.planId : subscription.planId;
    if (!planId) {
      throw new NotFoundError('Plan ID not found');
    }
    this._validatorService.validateIdFormat(planId);

    const plan = await this._subscriptionPlanRepository.findById(planId);
    const patient = await this._patientRepository.findById(subscription.patientId!);
    if (patient && plan) {
      const notification: Notification = {
        userId: subscription.patientId,
        type: NotificationType.SUBSCRIPTION_EXPIRED,
        message: `Your subscription to ${plan.name} has expired due to no remaining appointments or end date reached.`,
        createdAt: new Date(),
      };

      this._validatorService.validateRequiredFields({
        userId: notification.userId,
        type: notification.type,
        message: notification.message,
      });
      this._validatorService.validateIdFormat(notification.userId!);
      this._validatorService.validateEnum(notification.type, [
        'SUBSCRIPTION_CONFIRMED',
        'SUBSCRIPTION_CANCELLED',
        'SUBSCRIPTION_EXPIRED',
      ]);
      this._validatorService.validateLength(notification.message, 1, 1000);

      this._validatorService.validateEmailFormat(patient.email);
      const emailSubject = 'Subscription Expired';
      const emailText = `Dear ${patient.name},\n\nYour subscription to ${plan.name} has expired. Please renew your plan to continue booking appointments.\n\nBest regards,\nDOCit Team`;
      this._validatorService.validateLength(emailSubject, 1, 100);
      this._validatorService.validateLength(emailText, 1, 1000);

      await this._notificationService.sendNotification(notification);
      await this._emailService.sendEmail(patient.email, emailSubject, emailText);
    }
  }
}
