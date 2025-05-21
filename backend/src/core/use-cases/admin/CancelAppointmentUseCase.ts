import { DateUtils } from '../../../utils/DateUtils';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import logger from '../../../utils/logger';
import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';
import { IAvailabilityRepository } from '../../interfaces/repositories/IAvailabilityRepository';
import { IPatientSubscriptionRepository } from '../../interfaces/repositories/IPatientSubscriptionRepository';

export class CancelAppointmentUseCase {
  constructor(
    private appointmentRepository: IAppointmentRepository,
    private availabilityRepository: IAvailabilityRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository
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

    await this.appointmentRepository.deleteById(appointmentId);

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
  }
}
