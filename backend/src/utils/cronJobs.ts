import { Notification, NotificationType } from '../core/entities/Notification';
import { Container } from '../infrastructure/di/container';
import { AppointmentRepository } from '../infrastructure/repositories/AppointmentRepository';
import { NotificationService } from '../infrastructure/services/NotificationService';
import { DateUtils } from './DateUtils';
import logger from './logger';
import cron from 'node-cron';

export const setupCronJobs = (container: Container) => {
  const appointmentRepository = container.get<AppointmentRepository>('IAppointmentRepository');
  const notificationService = container.get<NotificationService>('INotificationService');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const twentyNineMinutesFromNow = new Date(now.getTime() + 29 * 60 * 1000);
      const thirtyOneMinutesFromNow = new Date(now.getTime() + 31 * 60 * 1000);
      const appointments = await appointmentRepository.findUpcomingAppointments(
        twentyNineMinutesFromNow,
        thirtyOneMinutesFromNow
      );

      for (const appointment of appointments) {
        try {
          // Type guards to check if patientId and doctorId are populated objects
          const patientId =
            typeof appointment.patientId === 'object'
              ? appointment.patientId
              : { _id: appointment.patientId, name: 'Unknown Patient' };
          const doctorId =
            typeof appointment.doctorId === 'object'
              ? appointment.doctorId
              : { _id: appointment.doctorId, name: 'Unknown Doctor' };

          if (!patientId._id || !doctorId._id) {
            logger.error(`Missing patientId or doctorId for appointment ${appointment._id}`);
            continue;
          }
          if (appointment.reminderSent) {
            logger.info(`Reminder already sent for appointment ${appointment._id}`);
            continue;
          }

          const startTime = DateUtils.combineDateAndTime(appointment.date, appointment.startTime);
          const patientNotification: Notification = {
            userId: patientId._id.toString(),
            message: `Your appointment with Dr. ${doctorId.name || 'Unknown Doctor'} is in 30 minutes at ${startTime}.`,
            type: NotificationType.APPOINTMENT_REMINDER,
            createdAt: new Date(),
          };
          const doctorNotification: Notification = {
            userId: doctorId._id.toString(),
            message: `Your appointment with patient ${patientId.name || 'Unknown Patient'} is in 30 minutes at ${startTime}.`,
            type: NotificationType.APPOINTMENT_REMINDER,
            createdAt: new Date(),
          };

          await notificationService.sendNotification(patientNotification);
          await notificationService.sendNotification(doctorNotification);
          await appointmentRepository.update(appointment._id!, { reminderSent: true });
          logger.info(`Sent reminder for appointment ${appointment._id}`);
        } catch (error) {
          logger.error(`Failed to send reminder for appointment ${appointment._id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in appointment reminder cron job:', error);
    }
  });
};
