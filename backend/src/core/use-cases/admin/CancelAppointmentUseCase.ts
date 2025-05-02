import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import { DateUtils } from '../../../utils/DateUtils';
import { IAvailabilityRepository } from '../../interfaces/repositories/IAvailabilityRepository';
import { IPatientSubscriptionRepository } from '../../interfaces/repositories/IPatientSubscriptionRepository';

export class CancelAppointmentUseCase {
  constructor(
    private appointmentRepository: IAppointmentRepository,
    private availabilityRepository: IAvailabilityRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository
  ) {}

  async execute(appointmentId: string): Promise<void> {
    const appointment =
      await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }
    if (appointment.status === 'cancelled') {
      throw new ValidationError('Appointment already cancelled');
    }

    await this.appointmentRepository.update(appointmentId, {
      status: 'cancelled',
    });

    if (!appointment.isFreeBooking) {
      const subscription =
        await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(
          appointment.patientId,
          appointment.doctorId
        );
      if (subscription) {
        await this.patientSubscriptionRepository.decrementAppointmentCount(
          subscription._id!
        );
      }
    }

    await this.availabilityRepository.updateSlotBookingStatus(
      appointment.doctorId,
      DateUtils.startOfDayUTC(appointment.date),
      appointment.startTime,
      false
    );
  }
}
