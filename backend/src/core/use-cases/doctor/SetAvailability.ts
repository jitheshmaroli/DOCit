import moment from 'moment';
import { Availability, TimeSlot } from '../../entities/Availability';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { IAvailabilityRepository } from '../../interfaces/repositories/IAvailabilityRepository';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import { DateUtils } from '../../../utils/DateUtils';
import logger from '../../../utils/logger';

export class SetAvailabilityUseCase {
  constructor(
    private doctorRepository: IDoctorRepository,
    private availabilityRepository: IAvailabilityRepository
  ) {}

  async execute(
    doctorId: string,
    date: Date,
    timeSlots: TimeSlot[],
    isRecurring: boolean = false,
    recurringEndDate?: Date,
    recurringDays?: number[],
    forceCreate: boolean = true
  ): Promise<{ availabilities: Availability | Availability[]; conflicts: { date: string; error: string }[] }> {
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
      slot.isBooked = false;
      DateUtils.validateTimeSlot(slot.startTime, slot.endTime, utcDate);
    });

    const conflicts: { date: string; error: string }[] = [];
    const availabilities: Availability[] = [];

    if (isRecurring && recurringEndDate && recurringDays) {
      const utcRecurringEndDate = DateUtils.parseToUTC(recurringEndDate);
      if (!DateUtils.isFutureDate(utcRecurringEndDate)) {
        throw new ValidationError('Recurring end date must be in the future');
      }
      if (recurringDays.length === 0) {
        throw new ValidationError('At least one recurring day is required');
      }

      const recurringDates = DateUtils.generateRecurringDates(utcDate, utcRecurringEndDate, recurringDays);

      for (const recDate of recurringDates) {
        try {
          const existing = await this.availabilityRepository.findByDoctorAndDate(doctorId, recDate);

          if (existing) {
            const allSlots = [...existing.timeSlots, ...timeSlots];
            DateUtils.checkOverlappingSlots(allSlots, recDate);
            await this.availabilityRepository.update(existing._id!, {
              timeSlots: allSlots,
            });
            const updatedAvailability = await this.availabilityRepository.findByDoctorAndDate(doctorId, recDate);
            if (!updatedAvailability) {
              throw new NotFoundError('Failed to retrieve updated availability');
            }
            availabilities.push(updatedAvailability);
          } else {
            const availability: Availability = {
              doctorId,
              date: DateUtils.startOfDayUTC(recDate),
              timeSlots: timeSlots.map((slot) => ({ ...slot, isBooked: false })),
            };
            const createdAvailability = await this.availabilityRepository.create(availability);
            availabilities.push(createdAvailability);
          }
        } catch (error) {
          if (error instanceof ValidationError && error.message.includes('Time slots cannot overlap')) {
            conflicts.push({
              date: DateUtils.formatToISO(recDate),
              error: `Time slots overlap with existing slots on ${moment.utc(recDate).format('YYYY-MM-DD')}`,
            });
            if (!forceCreate) {
              throw new ValidationError(
                `Time slot conflicts detected on ${moment.utc(recDate).format('YYYY-MM-DD')}. Set forceCreate to true to proceed with non-conflicting dates.`
              );
            }
          } else {
            throw error; // Re-throw unexpected errors
          }
        }
      }

      if (conflicts.length > 0 && availabilities.length === 0 && !forceCreate) {
        throw new ValidationError(
          'No slots created due to conflicts. Set forceCreate to true to proceed with non-conflicting dates.'
        );
      }

      logger.debug('Set recurring availability:', { doctorId, availabilities, conflicts });
      return { availabilities, conflicts };
    }

    // Non-recurring case
    try {
      DateUtils.checkOverlappingSlots(timeSlots, utcDate);
      const existing = await this.availabilityRepository.findByDoctorAndDate(doctorId, utcDate);

      if (existing) {
        const allSlots = [...existing.timeSlots, ...timeSlots];
        DateUtils.checkOverlappingSlots(allSlots, utcDate);
        await this.availabilityRepository.update(existing._id!, {
          timeSlots: allSlots,
        });
        const updatedAvailability = await this.availabilityRepository.findByDoctorAndDate(doctorId, utcDate);
        if (!updatedAvailability) {
          throw new NotFoundError('Failed to retrieve updated availability');
        }
        return { availabilities: updatedAvailability, conflicts: [] };
      }

      const availability: Availability = {
        doctorId,
        date: DateUtils.startOfDayUTC(utcDate),
        timeSlots: timeSlots.map((slot) => ({ ...slot, isBooked: false })),
      };

      const createdAvailability = await this.availabilityRepository.create(availability);
      return { availabilities: createdAvailability, conflicts: [] };
    } catch (error) {
      if (error instanceof ValidationError && error.message.includes('Time slots cannot overlap')) {
        conflicts.push({
          date: DateUtils.formatToISO(utcDate),
          error: `Time slots overlap with existing slots on ${moment.utc(utcDate).format('YYYY-MM-DD')}`,
        });
        throw new ValidationError(`Time slot conflict on ${moment.utc(utcDate).format('YYYY-MM-DD')}`);
      }
      throw error;
    }
  }
}
