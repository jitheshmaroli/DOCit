import { PatientSubscription } from '../../entities/PatientSubscription';
import { ISubscriptionPlanRepository } from '../../interfaces/repositories/ISubscriptionPlanRepository';
import { IPatientSubscriptionRepository } from '../../interfaces/repositories/IPatientSubscriptionRepository';
import { IPatientRepository } from '../../interfaces/repositories/IPatientRepository';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import moment from 'moment';
import { StripeService } from '../../../infrastructure/services/StripeService';
import { Notification, NotificationType } from '../../entities/Notification';
import { INotificationService } from '../../interfaces/services/INotificationService';
import { IEmailService } from '../../interfaces/services/IEmailService';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';

export class ConfirmSubscriptionUseCase {
  constructor(
    private subscriptionPlanRepository: ISubscriptionPlanRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository,
    private patientRepository: IPatientRepository,
    private stripeService: StripeService,
    private notificationService: INotificationService,
    private emailService: IEmailService,
    private doctorRepository: IDoctorRepository
  ) {}

  async execute(patientId: string, planId: string, paymentIntentId: string): Promise<PatientSubscription> {
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

    // Notifications for patient and doctor
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

    // Email notifications
    const patientEmailSubject = 'Subscription Confirmation';
    const patientEmailText = `Dear ${patient.name},\n\nYour subscription to the plan "${plan.name}" with Dr. ${doctor.name} has been successfully confirmed. It is valid until ${endDate.toLocaleDateString()} and includes ${plan.appointmentCount} appointments.\n\nBest regards,\nDOCit Team`;
    const doctorEmailSubject = 'New Subscription';
    const doctorEmailText = `Dear Dr. ${doctor.name},\n\n${patient.name} has subscribed to your plan "${plan.name}". The subscription is valid until ${endDate.toLocaleDateString()}.\n\nBest regards,\nDOCit Team`;

    // Send notifications and emails
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
