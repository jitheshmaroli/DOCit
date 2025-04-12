import { Availability, TimeSlot } from '../../entities/Availability';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { IAvailabilityRepository } from '../../interfaces/repositories/IAvailabilityRepository';
import { NotFoundError, ValidationError } from '../../../utils/errors';

export class SetAvailabilityUseCase {
  constructor(
    private doctorRepository: IDoctorRepository,
    private availabilityRepository: IAvailabilityRepository
  ) {}

  async execute(
    doctorId: string,
    date: Date,
    timeSlots: TimeSlot[]
  ): Promise<Availability> {
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) throw new NotFoundError('Doctor not found');

    if (!timeSlots.length)
      throw new ValidationError('At least one time slot is required');

    timeSlots.forEach((slot, index) => {
      if (!slot.startTime || !slot.endTime) {
        throw new ValidationError(
          `Time slot at index ${index} is missing startTime or endTime`
        );
      }

      const start = new Date(`1970-01-01T${slot.startTime}:00`);
      const end = new Date(`1970-01-01T${slot.endTime}:00`);
      if (start >= end)
        throw new ValidationError('Start time must be before end time');
    });

    const availability: Availability = {
      doctorId,
      date,
      timeSlots,
    };

    const existing = await this.availabilityRepository.findByDoctorAndDate(
      doctorId,
      date
    );
    if (existing) {
      const updated = await this.availabilityRepository.update(existing._id!, {
        timeSlots,
      });
      if (!updated) {
        throw new NotFoundError(
          'Failed to update availability; record not found'
        );
      }
      return updated;
    }
    return this.availabilityRepository.create(availability);
  }
}
