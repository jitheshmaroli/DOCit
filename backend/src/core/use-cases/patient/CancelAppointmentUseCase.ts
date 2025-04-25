import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';
import { IAvailabilityRepository } from '../../interfaces/repositories/IAvailabilityRepository';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import moment from 'moment';
import { DateUtils } from '../../../utils/DateUtils';

export class CancelAppointmentUseCase {
  constructor(
    private appointmentRepository: IAppointmentRepository,
    private availabilityRepository: IAvailabilityRepository
  ) {}

  async execute(appointmentId: string, patientId: string): Promise<void> {
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }
    if (appointment.patientId !== patientId) {
      throw new ValidationError('Unauthorized');
    }
    if (appointment.status === 'cancelled') {
      throw new ValidationError('Appointment already cancelled');
    }

    const bookingTime = moment(appointment.bookingTime);
    const now = moment();
    const minutesSinceBooking = now.diff(bookingTime, 'minutes');

    if (minutesSinceBooking > 30) {
      throw new ValidationError('Cannot cancel appointment after 30 minutes');
    }

    const slotTime = moment(appointment.date).set({
      hour: parseInt(appointment.startTime.split(':')[0]),
      minute: parseInt(appointment.startTime.split(':')[1]),
    });
    if (slotTime.isBefore(now)) {
      throw new ValidationError(
        'Cannot cancel an appointment that has already started'
      );
    }

    await this.appointmentRepository.update(appointmentId, {
      status: 'cancelled',
    });

    await this.availabilityRepository.updateSlotBookingStatus(
      appointment.doctorId,
      DateUtils.startOfDayUTC(appointment.date),
      appointment.startTime,
      false
    );
  }
}