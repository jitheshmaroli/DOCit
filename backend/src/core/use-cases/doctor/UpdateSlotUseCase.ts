import { Availability } from '../../entities/Availability';
import { IAvailabilityRepository } from '../../interfaces/repositories/IAvailabilityRepository';
import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import moment from 'moment';

export class UpdateSlotUseCase {
  constructor(
    private availabilityRepository: IAvailabilityRepository,
    private appointmentRepository: IAppointmentRepository
  ) {}

  async execute(
    availabilityId: string,
    slotIndex: number,
    newSlot: { startTime: string; endTime: string },
    doctorId: string
  ): Promise<Availability | null> {
    const availability = await this.availabilityRepository.findById(availabilityId);
    if (!availability) throw new NotFoundError('Availability not found');
    if (availability.doctorId !== doctorId) throw new ValidationError('Unauthorized');

    if (slotIndex < 0 || slotIndex >= availability.timeSlots.length) {
      throw new ValidationError('Invalid slot index');
    }

    const currentSlot = availability.timeSlots[slotIndex];
    if (currentSlot.isBooked) {
      throw new ValidationError('Cannot update slot: it is booked by a patient');
    }

    const appointment = await this.appointmentRepository.findByDoctorAndSlot(
      doctorId,
      availability.date,
      currentSlot.startTime,
      currentSlot.endTime
    );
    if (appointment && appointment.status !== 'cancelled') {
      throw new ValidationError('Cannot update slot: it is booked by a patient');
    }

    const slotStart = moment(
      `${moment(availability.date).format('YYYY-MM-DD')} ${newSlot.startTime}`,
      'YYYY-MM-DD HH:mm'
    );
    const slotEnd = moment(
      `${moment(availability.date).format('YYYY-MM-DD')} ${newSlot.endTime}`,
      'YYYY-MM-DD HH:mm'
    );

    if (slotStart >= slotEnd) {
      throw new ValidationError('Start time must be before end time');
    }

    if (moment(availability.date).isSame(moment(), 'day') && slotStart.isBefore(moment())) {
      throw new ValidationError('Cannot set slot before current time');
    }

    availability.timeSlots.forEach((existingSlot, index) => {
      if (index !== slotIndex) {
        const existingStart = moment(
          `${moment(availability.date).format('YYYY-MM-DD')} ${existingSlot.startTime}`,
          'YYYY-MM-DD HH:mm'
        );
        const existingEnd = moment(
          `${moment(availability.date).format('YYYY-MM-DD')} ${existingSlot.endTime}`,
          'YYYY-MM-DD HH:mm'
        );
        if (
          (slotStart.isSameOrAfter(existingStart) && slotStart.isBefore(existingEnd)) ||
          (slotEnd.isAfter(existingStart) && slotEnd.isSameOrBefore(existingEnd)) ||
          (slotStart.isSameOrBefore(existingStart) && slotEnd.isSameOrAfter(existingEnd))
        ) {
          throw new ValidationError('Updated slot overlaps with existing slot');
        }
      }
    });

    return this.availabilityRepository.updateSlot(availabilityId, slotIndex, newSlot);
  }
}