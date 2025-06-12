import { DateUtils } from '../../../utils/DateUtils';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import logger from '../../../utils/logger';
import { Appointment } from '../../entities/Appointment';
import { Notification, NotificationType } from '../../entities/Notification';
import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';
import { IAvailabilityRepository } from '../../interfaces/repositories/IAvailabilityRepository';
import { IPatientSubscriptionRepository } from '../../interfaces/repositories/IPatientSubscriptionRepository';
import { INotificationService } from '../../interfaces/services/INotificationService';
import { IEmailService } from '../../interfaces/services/IEmailService';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { IPatientRepository } from '../../interfaces/repositories/IPatientRepository';

export class CancelAppointmentUseCase {
  constructor(
    private appointmentRepository: IAppointmentRepository,
    private availabilityRepository: IAvailabilityRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository,
    private notificationService: INotificationService,
    private emailService: IEmailService,
    private doctorRepository: IDoctorRepository,
    private patientRepository: IPatientRepository
  ) {}

  async execute(appointmentId: string, patientId: string, cancellationReason?: string): Promise<void> {
    if (!patientId) {
      logger.error('No patientId provided for appointment cancellation');
      throw new ValidationError('Patient ID is required');
    }

    const appointment: Appointment | null = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      logger.error(`Appointment not found: ${appointmentId}`);
      throw new NotFoundError('Appointment not found');
    }

    logger.info('Appointment details:', { appointment });
    logger.info('Provided patientId:', { patientId });

    const appointmentPatientId =
      typeof appointment.patientId === 'object' && appointment.patientId !== null
        ? appointment.patientId._id?.toString()
        : appointment.patientId?.toString();

    if (appointmentPatientId !== patientId) {
      logger.error(
        `Authorization failed: Provided patientId ${patientId} does not match appointment patientId ${appointmentPatientId}`
      );
      throw new ValidationError('You are not authorized to cancel this appointment');
    }

    if (appointment.status === 'cancelled') {
      logger.warn(`Appointment already cancelled: ${appointmentId}`);
      throw new ValidationError('Appointment is already cancelled');
    }

    const doctorId =
      typeof appointment.doctorId === 'object' && appointment.doctorId !== null
        ? appointment.doctorId._id?.toString()
        : appointment.doctorId?.toString();

    if (!doctorId) {
      logger.error(`Invalid doctorId for appointment ${appointmentId}`);
      throw new ValidationError('Invalid doctor ID');
    }

    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) throw new NotFoundError('Doctor not found');

    const patient = await this.patientRepository.findById(patientId);
    if (!patient) throw new NotFoundError('Patient not found');

    // Update appointment with cancellation status and reason
    await this.appointmentRepository.update(appointmentId, {
      status: 'cancelled',
      cancellationReason,
    });
    logger.info(`Appointment cancelled: ${appointmentId}`);

    const startOfDay = DateUtils.startOfDayUTC(appointment.date);
    try {
      await this.availabilityRepository.updateSlotBookingStatus(doctorId, startOfDay, appointment.startTime, false);
      logger.info(`Availability slot updated for doctor ${doctorId} on ${startOfDay}`);
    } catch (error) {
      logger.error(`Failed to update availability slot for doctor ${doctorId}: ${(error as Error).message}`);
      throw new Error(`Failed to update availability: ${(error as Error).message}`);
    }

    if (!appointment.isFreeBooking) {
      const subscription = await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, doctorId);
      if (subscription) {
        await this.patientSubscriptionRepository.decrementAppointmentCount(subscription._id!);
        logger.info(`Decremented appointment count for subscription ${subscription._id}`);
      } else {
        logger.warn(`No active subscription found for patient ${patientId} and doctor ${doctorId}`);
      }
    }

    // Notifications for patient and doctor
    const patientNotification: Notification = {
      userId: patientId,
      type: NotificationType.APPOINTMENT_CANCELLED,
      message: `Your appointment with Dr. ${doctor.name} for ${appointment.startTime} on ${appointment.date.toLocaleDateString()} has been cancelled.${cancellationReason ? ` Reason: ${cancellationReason}` : ''}`,
      isRead: false,
      createdAt: new Date(),
    };

    const doctorNotification: Notification = {
      userId: doctorId,
      type: NotificationType.APPOINTMENT_CANCELLED,
      message: `An appointment with ${patient.name} for ${appointment.startTime} on ${appointment.date.toLocaleDateString()} has been cancelled.${cancellationReason ? ` Reason: ${cancellationReason}` : ''}`,
      isRead: false,
      createdAt: new Date(),
    };

    // Email notifications
    const patientEmailSubject = 'Appointment Cancellation';
    const patientEmailText = `Dear ${patient.name},\n\nYour appointment with Dr. ${doctor.name} for ${appointment.startTime} on ${appointment.date.toLocaleDateString()} has been cancelled.${cancellationReason ? ` Reason: ${cancellationReason}` : ''}\n\nBest regards,\nDOCit Team`;
    const doctorEmailSubject = 'Appointment Cancellation';
    const doctorEmailText = `Dear Dr. ${doctor.name},\n\nAn appointment with ${patient.name} for ${appointment.startTime} on ${appointment.date.toLocaleDateString()} has been cancelled.${cancellationReason ? ` Reason: ${cancellationReason}` : ''}\n\nBest regards,\nDOCit Team`;

    // Send notifications and emails
    await Promise.all([
      this.notificationService.sendNotification(patientNotification),
      this.notificationService.sendNotification(doctorNotification),
      this.emailService.sendEmail(patient.email, patientEmailSubject, patientEmailText),
      this.emailService.sendEmail(doctor.email, doctorEmailSubject, doctorEmailText),
    ]);
  }
}
