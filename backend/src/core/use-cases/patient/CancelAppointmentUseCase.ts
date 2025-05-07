import { DateUtils } from "../../../utils/DateUtils";
import { NotFoundError, ValidationError } from "../../../utils/errors";
import logger from "../../../utils/logger";
import { IAppointmentRepository } from "../../interfaces/repositories/IAppointmentRepository";
import { IAvailabilityRepository } from "../../interfaces/repositories/IAvailabilityRepository";
import { IPatientSubscriptionRepository } from "../../interfaces/repositories/IPatientSubscriptionRepository";

export class CancelAppointmentUseCase {
  constructor(
    private appointmentRepository: IAppointmentRepository,
    private availabilityRepository: IAvailabilityRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository
  ) {}

  async execute(appointmentId: string, patientId: string): Promise<void> {
    // Validate patientId
    if (!patientId) {
      logger.error('No patientId provided for appointment cancellation');
      throw new ValidationError('Patient ID is required');
    }

    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      logger.error(`Appointment not found: ${appointmentId}`);
      throw new NotFoundError('Appointment not found');
    }

    logger.info('Appointment details:', { appointment });
    logger.info('Provided patientId:', { patientId });

    // Handle populated patientId (Mongoose may return an object)
    const appointmentPatientId = typeof appointment.patientId === 'object' && appointment.patientId !== null
      ? (appointment.patientId as any)._id?.toString()
      : appointment.patientId?.toString();

    if (appointmentPatientId !== patientId) {
      logger.error(`Authorization failed: Provided patientId ${patientId} does not match appointment patientId ${appointmentPatientId}`);
      throw new ValidationError('You are not authorized to cancel this appointment');
    }

    if (appointment.status === 'cancelled') {
      logger.warn(`Appointment already cancelled: ${appointmentId}`);
      throw new ValidationError('Appointment is already cancelled');
    }

    // Handle populated doctorId (Mongoose may return an object)
    const doctorId = typeof appointment.doctorId === 'object' && appointment.doctorId !== null
      ? (appointment.doctorId as any)._id?.toString()
      : appointment.doctorId?.toString();

    if (!doctorId) {
      logger.error(`Invalid doctorId for appointment ${appointmentId}`);
      throw new ValidationError('Invalid doctor ID');
    }

    await this.appointmentRepository.deleteById(appointmentId);
    logger.info(`Appointment deleted: ${appointmentId}`);

    const startOfDay = DateUtils.startOfDayUTC(appointment.date);
    try {
      await this.availabilityRepository.updateSlotBookingStatus(
        doctorId,
        startOfDay,
        appointment.startTime,
        false
      );
      logger.info(`Availability slot updated for doctor ${doctorId} on ${startOfDay}`);
    } catch (error: any) {
      logger.error(`Failed to update availability slot for doctor ${doctorId}: ${error.message}`);
      throw new Error(`Failed to update availability: ${error.message}`);
    }

    if (!appointment.isFreeBooking) {
      const subscription = await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(
        patientId,
        doctorId
      );
      if (subscription) {
        await this.patientSubscriptionRepository.decrementAppointmentCount(subscription._id!);
        logger.info(`Decremented appointment count for subscription ${subscription._id}`);
      } else {
        logger.warn(`No active subscription found for patient ${patientId} and doctor ${doctorId}`);
      }
    }
  }
}