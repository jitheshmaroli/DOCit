import { DateUtils } from '../../../utils/DateUtils';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import logger from '../../../utils/logger';
import { Notification, NotificationType } from '../../entities/Notification';
import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';
import { IAvailabilityRepository } from '../../interfaces/repositories/IAvailabilityRepository';
import { IPatientSubscriptionRepository } from '../../interfaces/repositories/IPatientSubscriptionRepository';
import { INotificationService } from '../../interfaces/services/INotificationService';

export class AdminCancelAppointmentUseCase {
  constructor(
    private appointmentRepository: IAppointmentRepository,
    private availabilityRepository: IAvailabilityRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository,
    private notificationService: INotificationService
  ) {}

  async execute(appointmentId: string): Promise<void> {
    const appointment = await this.appointmentRepository.findById(appointmentId);

    if (!appointment) {
      logger.error(`Appointment not found: ${appointmentId}`);
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.status === 'cancelled') {
      logger.warn(`Appointment already cancelled: ${appointmentId}`);
      throw new Error('Appointment is already cancelled');
    }

    const patientId =
      typeof appointment.patientId === 'object' && appointment.patientId !== null
        ? appointment.patientId._id?.toString()
        : appointment.patientId?.toString();

    const doctorId =
      typeof appointment.doctorId === 'object' && appointment.doctorId !== null
        ? appointment.doctorId._id?.toString()
        : appointment.doctorId?.toString();

    if (!doctorId) {
      throw new ValidationError('Invalid doctor ID');
    }

    await this.appointmentRepository.update(appointmentId, { status: 'cancelled' });

    const startOfDay = DateUtils.startOfDayUTC(appointment.date);
    try {
      await this.availabilityRepository.updateSlotBookingStatus(doctorId, startOfDay, appointment.startTime, false);
    } catch (error) {
      logger.error(`Failed to update availability slot for doctor ${doctorId}: ${(error as Error).message}`);
      throw new Error(`Failed to update availability: ${(error as Error).message}`);
    }

    if (!appointment.isFreeBooking && patientId) {
      const subscription = await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, doctorId);
      if (subscription) {
        await this.patientSubscriptionRepository.decrementAppointmentCount(subscription._id!);
      } else {
        logger.warn(`No active subscription found for patient ${patientId} and doctor ${doctorId}`);
      }
    }

    const doctorName =
      typeof appointment.doctorId === 'object' && appointment.doctorId !== null ? appointment.doctorId.name : null;
    const patientName =
      typeof appointment.patientId === 'object' && appointment.patientId !== null ? appointment.patientId.name : null;

    const patientNotification: Notification = {
      userId: patientId,
      type: NotificationType.APPOINTMENT_CANCELLED,
      message: `Your appointment with Dr. ${doctorName} for ${appointment.startTime} on ${appointment.date.toLocaleDateString()} has been cancelled.`,
      isRead: false,
      createdAt: new Date(),
    };

    const doctorNotification: Notification = {
      userId: doctorId,
      type: NotificationType.APPOINTMENT_CANCELLED,
      message: `An appointment with ${patientName} for ${appointment.startTime} on ${appointment.date.toLocaleDateString()} hs been cancelled.`,
      isRead: false,
      createdAt: new Date(),
    };

    // Send notifications
    await Promise.all([
      this.notificationService.sendNotification(patientNotification),
      this.notificationService.sendNotification(doctorNotification),
    ]);
  }
}
