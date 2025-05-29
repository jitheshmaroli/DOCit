import { IAvailabilityRepository } from '../../core/interfaces/repositories/IAvailabilityRepository';
import { Availability } from '../../core/entities/Availability';
import { BaseRepository } from './BaseRepository';
import { AvailabilityModel } from '../database/models/AvailabilityModel';
import { DateUtils } from '../../utils/DateUtils';
import { ValidationError } from '../../utils/errors';
import logger from '../../utils/logger';

export class AvailabilityRepository extends BaseRepository<Availability> implements IAvailabilityRepository {
  constructor() {
    super(AvailabilityModel);
  }

  async findByDoctorAndDate(doctorId: string, date: Date): Promise<Availability | null> {
    const startOfDay = DateUtils.startOfDayUTC(date);
    const endOfDay = DateUtils.endOfDayUTC(date);
    const availability = await this.model
      .findOne({
        doctorId,
        date: { $gte: startOfDay, $lte: endOfDay },
      })
      .exec();
    return availability ? (availability.toObject() as Availability) : null;
  }

  async findByDoctorAndDateRange(doctorId: string, startDate: Date, endDate: Date): Promise<Availability[]> {
    const availabilities = await this.model
      .find({
        doctorId,
        date: {
          $gte: DateUtils.startOfDayUTC(startDate),
          $lte: DateUtils.endOfDayUTC(endDate),
        },
      })
      .exec();
    return availabilities.map((avail) => avail.toObject() as Availability);
  }

  async findByDoctorAndDateRangeWithUnbookedSlots(
    doctorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Availability[]> {
    logger.debug('availabilityrepo:', doctorId);
    const availabilities = await this.model
      .aggregate([
        {
          $match: {
            doctorId,
            date: {
              $gte: DateUtils.startOfDayUTC(startDate),
              $lte: DateUtils.endOfDayUTC(endDate),
            },
          },
        },
        {
          $project: {
            _id: 1,
            doctorId: 1,
            date: 1,
            timeSlots: {
              $filter: {
                input: '$timeSlots',
                as: 'slot',
                cond: { $eq: ['$$slot.isBooked', false] },
              },
            },
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ])
      .exec();
    logger.debug('availabities:', availabilities);
    return availabilities as Availability[];
  }

  async removeSlot(availabilityId: string, slotIndex: number): Promise<Availability | null> {
    const availability = await this.model.findById(availabilityId).exec();
    if (!availability || slotIndex < 0 || slotIndex >= availability.timeSlots.length) {
      return null;
    }
    if (availability.timeSlots[slotIndex].isBooked) {
      throw new ValidationError('Cannot remove a booked slot');
    }
    availability.timeSlots.splice(slotIndex, 1);
    if (availability.timeSlots.length === 0) {
      await this.model.findByIdAndDelete(availabilityId).exec();
      return null;
    }
    await availability.save();
    return availability.toObject() as Availability;
  }

  async updateSlot(
    availabilityId: string,
    slotIndex: number,
    newSlot: { startTime: string; endTime: string }
  ): Promise<Availability | null> {
    const availability = await this.model.findById(availabilityId).exec();
    if (!availability || slotIndex < 0 || slotIndex >= availability.timeSlots.length) {
      return null;
    }
    if (availability.timeSlots[slotIndex].isBooked) {
      throw new ValidationError('Cannot update a booked slot');
    }
    availability.timeSlots[slotIndex] = { ...newSlot, isBooked: false };
    DateUtils.validateTimeSlot(newSlot.startTime, newSlot.endTime, availability.date);
    DateUtils.checkOverlappingSlots(availability.timeSlots, availability.date);
    await availability.save();
    return availability.toObject() as Availability;
  }

  async updateSlotBookingStatus(doctorId: string, date: Date, startTime: string, isBooked: boolean): Promise<void> {
    const startOfDay = DateUtils.startOfDayUTC(date);
    await this.model
      .updateOne(
        { doctorId, date: startOfDay },
        {
          $set: {
            'timeSlots.$[slot].isBooked': isBooked,
          },
        },
        {
          arrayFilters: [{ 'slot.startTime': startTime }],
        }
      )
      .exec();
  }
}
