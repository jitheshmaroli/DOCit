import cron from 'node-cron';
import { ICronService } from '../../core/interfaces/services/ICronService';
import { IAppointmentRepository } from '../../core/interfaces/repositories/IAppointmentRepository';
import { IPatientSubscriptionRepository } from '../../core/interfaces/repositories/IPatientSubscriptionRepository';
import { IEmailService } from '../../core/interfaces/services/IEmailService';
import { DateUtils } from '../../utils/DateUtils';
import logger from '../../utils/logger';
import { INotificationService } from '../../core/interfaces/services/INotificationService';
import { Notification, NotificationType } from '../../core/entities/Notification';

export class CronService implements ICronService {
  constructor(
    private _appointmentRepository: IAppointmentRepository,
    private _patientSubscriptionRepository: IPatientSubscriptionRepository,
    private _emailService: IEmailService,
    private _notificationService: INotificationService
  ) {}

  start(): void {
    cron.schedule('* * * * *', async () => {
      await this.runAppointmentReminderEmails();
    });

    cron.schedule('0 0 * * *', async () => {
      logger.info('cronjobfor sub running');
      await this.runSubscriptionExpiryUpdates();
    });

    logger.info('Cron jobs scheduled: appointment reminders and subscription expiry updates');
  }

  private async runAppointmentReminderEmails(): Promise<void> {
    try {
      const now = new Date();
      const twentyNineMinutesFromNow = new Date(now.getTime() + 29 * 60 * 1000);
      const thirtyOneMinutesFromNow = new Date(now.getTime() + 31 * 60 * 1000);

      const appointments = await this._appointmentRepository.findUpcomingAppointments(
        twentyNineMinutesFromNow,
        thirtyOneMinutesFromNow
      );

      for (const appointment of appointments) {
        try {
          const patient = appointment.patient;
          const doctor = appointment.doctor;

          if (!patient?._id || !doctor?._id || !patient.email || !doctor.email) {
            logger.error(`Missing details for appointment ${appointment._id}`);
            continue;
          }

          if (appointment.reminderSent) {
            logger.info(`Reminder already sent for appointment ${appointment._id}`);
            continue;
          }

          const startTime = DateUtils.combineDateAndTime(appointment.date, appointment.startTime);
          const appointmentTime = startTime.toLocaleString();

          const patientSubject = 'Appointment Reminder';
          const patientMessage = `Dear ${patient.name},\n\nYour appointment with Dr. ${doctor.name} is scheduled in 30 minutes at ${appointmentTime}.\n\nPlease be prepared and join on time.\n\nBest regards,\nDOCit Team`;
          await this._emailService.sendEmail(patient.email, patientSubject, patientMessage);

          const doctorSubject = 'Upcoming Appointment Reminder';
          const doctorMessage = `Dear Dr. ${doctor.name},\n\nYour appointment with ${patient.name} is scheduled in 30 minutes at ${appointmentTime}.\n\nPlease be prepared.\n\nBest regards,\nDOCit Team`;

          const patientNotification: Notification = {
            userId: patient._id.toString(),
            message: `Your appointment with Dr. ${doctor.name || 'Unknown Doctor'} is in 30 minutes at ${startTime}.`,
            type: NotificationType.APPOINTMENT_REMINDER,
            createdAt: new Date(),
          };
          const doctorNotification: Notification = {
            userId: doctor._id.toString(),
            message: `Your appointment with patient ${patient.name || 'Unknown Patient'} is in 30 minutes at ${startTime}.`,
            type: NotificationType.APPOINTMENT_REMINDER,
            createdAt: new Date(),
          };
          await this._emailService.sendEmail(doctor.email, doctorSubject, doctorMessage);
          await this._notificationService.sendNotification(patientNotification);
          await this._notificationService.sendNotification(doctorNotification);

          await this._appointmentRepository.update(appointment._id!, { reminderSent: true });
          logger.info(`Sent email reminders for appointment ${appointment._id}`);
        } catch (error) {
          logger.error(`Failed to send email reminder for appointment ${appointment._id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in appointment reminder email cron job:', error);
    }
  }

  private async runSubscriptionExpiryUpdates(): Promise<void> {
    try {
      const now = new Date();
      const today = DateUtils.startOfDayUTC(now);

      const expiringSubscriptions = await this._patientSubscriptionRepository.find({
        status: 'active',
        endDate: { $lte: today },
      });

      for (const subscription of expiringSubscriptions) {
        try {
          await this._patientSubscriptionRepository.update(subscription._id!, {
            status: 'expired',
            updatedAt: now,
          });
          logger.info(`Updated subscription ${subscription._id} to expired`);
        } catch (error) {
          logger.error(`Failed to update subscription ${subscription._id} to expired:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in subscription expiry update cron job:', error);
    }
  }
}
