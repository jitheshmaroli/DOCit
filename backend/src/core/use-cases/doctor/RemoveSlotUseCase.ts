import { Availability } from '../../entities/Availability';
import { IAvailabilityRepository } from '../../interfaces/repositories/IAvailabilityRepository';
import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import moment from 'moment';

export class RemoveSlotUseCase {
  constructor(
    private availabilityRepository: IAvailabilityRepository,
    private appointmentRepository: IAppointmentRepository
  ) {}

  async execute(availabilityId: string, slotIndex: number, doctorId: string): Promise<Availability | null> {
    const availability = await this.availabilityRepository.findById(availabilityId);
    if (!availability) throw new NotFoundError('Availability not found');
    if (availability.doctorId !== doctorId) throw new ValidationError('Unauthorized');

    if (slotIndex < 0 || slotIndex >= availability.timeSlots.length) {
      throw new ValidationError('Invalid slot index');
    }

    const slot = availability.timeSlots[slotIndex];
    const appointment = await this.appointmentRepository.findByDoctorAndSlot(
      doctorId,
      availability.date,
      slot.startTime,
      slot.endTime
    );
    if (appointment && appointment.status !== 'cancelled') {
      throw new ValidationError('Cannot delete slot: it is booked by a patient');
    }

    return this.availabilityRepository.removeSlot(availabilityId, slotIndex);
  }
}