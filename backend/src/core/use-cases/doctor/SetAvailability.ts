import { Availability, TimeSlot } from '../../entities/Availability';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { IAvailabilityRepository } from '../../interfaces/repositories/IAvailabilityRepository';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import { DateUtils } from '../../../utils/DateUtils';

export class SetAvailabilityUseCase {
  constructor(
    private doctorRepository: IDoctorRepository,
    private availabilityRepository: IAvailabilityRepository
  ) {}

  async execute(doctorId: string, date: Date, timeSlots: TimeSlot[]): Promise<Availability> {
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) throw new NotFoundError('Doctor not found');

    if (!timeSlots.length) throw new ValidationError('At least one time slot is required');

    const utcDate = DateUtils.parseToUTC(date);
    if (!DateUtils.isFutureDate(utcDate)) {
      throw new ValidationError('Cannot set availability for past dates');
    }

    timeSlots.forEach((slot, index) => {
      if (!slot.startTime || !slot.endTime) {
        throw new ValidationError(`Time slot at index ${index} is missing startTime or endTime`);
      }
      slot.isBooked = false; // Ensure new slots are unbooked
      DateUtils.validateTimeSlot(slot.startTime, slot.endTime, utcDate);
    });

    DateUtils.checkOverlappingSlots(timeSlots, utcDate);

    const existing = await this.availabilityRepository.findByDoctorAndDate(doctorId, utcDate);

    if (existing) {
      const allSlots = [...existing.timeSlots, ...timeSlots];
      DateUtils.checkOverlappingSlots(allSlots, utcDate);
      await this.availabilityRepository.update(existing._id!, { timeSlots: allSlots });
      const updatedAvailability = await this.availabilityRepository.findByDoctorAndDate(doctorId, utcDate);
      if (!updatedAvailability) {
        throw new NotFoundError('Failed to retrieve updated availability');
      }
      return updatedAvailability;
    }

    const availability: Availability = {
      doctorId,
      date: DateUtils.startOfDayUTC(utcDate),
      timeSlots,
    };

    const createdAvailability = await this.availabilityRepository.create(availability);
    return createdAvailability;
  }
}