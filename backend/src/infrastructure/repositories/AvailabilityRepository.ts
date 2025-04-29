import { Availability } from '../../core/entities/Availability';
import { IAvailabilityRepository } from '../../core/interfaces/repositories/IAvailabilityRepository';
import { AvailabilityModel } from '../database/models/AvailabilityModel';
import { DateUtils } from '../../utils/DateUtils';
import { ValidationError } from '../../utils/errors';

export class AvailabilityRepository implements IAvailabilityRepository {
  async create(availability: Availability): Promise<Availability> {
    const newAvailability = new AvailabilityModel({
      ...availability,
      date: DateUtils.startOfDayUTC(availability.date),
    });
    return newAvailability.save();
  }

  async findById(id: string): Promise<Availability | null> {
    return AvailabilityModel.findById(id).exec();
  }

  async findByDoctorAndDate(
    doctorId: string,
    date: Date
  ): Promise<Availability | null> {
    const startOfDay = DateUtils.startOfDayUTC(date);
    const endOfDay = DateUtils.endOfDayUTC(date);
    return AvailabilityModel.findOne({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).exec();
  }

  async findByDoctorAndDateRange(
    doctorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Availability[]> {
    return AvailabilityModel.find({
      doctorId,
      date: {
        $gte: DateUtils.startOfDayUTC(startDate),
        $lte: DateUtils.endOfDayUTC(endDate),
      },
    }).exec();
  }

  async findByDoctorAndDateRangeWithUnbookedSlots(
    doctorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Availability[]> {
    return AvailabilityModel.aggregate([
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
          doctorId: 1,
          date: 1,
          timeSlots: {
            $filter: {
              input: '$timeSlots',
              as: 'slot',
              cond: { $eq: ['$$slot.isBooked', false] },
            },
          },
        },
      },
    ]).exec();
  }

  async update(id: string, updates: Partial<Availability>): Promise<void> {
    await AvailabilityModel.findByIdAndUpdate(id, updates).exec();
  }

  async delete(id: string): Promise<void> {
    await AvailabilityModel.findByIdAndDelete(id).exec();
  }

  async removeSlot(
    availabilityId: string,
    slotIndex: number
  ): Promise<Availability | null> {
    const availability =
      await AvailabilityModel.findById(availabilityId).exec();
    if (!availability) return null;
    if (slotIndex < 0 || slotIndex >= availability.timeSlots.length) {
      return null;
    }
    if (availability.timeSlots[slotIndex].isBooked) {
      throw new ValidationError('Cannot remove a booked slot');
    }
    availability.timeSlots.splice(slotIndex, 1);
    if (availability.timeSlots.length === 0) {
      await AvailabilityModel.findByIdAndDelete(availabilityId).exec();
      return null;
    }
    await availability.save();
    return availability;
  }

  async updateSlot(
    availabilityId: string,
    slotIndex: number,
    newSlot: { startTime: string; endTime: string }
  ): Promise<Availability | null> {
    const availability =
      await AvailabilityModel.findById(availabilityId).exec();
    if (!availability) return null;
    if (slotIndex < 0 || slotIndex >= availability.timeSlots.length) {
      return null;
    }
    if (availability.timeSlots[slotIndex].isBooked) {
      throw new ValidationError('Cannot update a booked slot');
    }
    availability.timeSlots[slotIndex] = { ...newSlot, isBooked: false };
    DateUtils.validateTimeSlot(
      newSlot.startTime,
      newSlot.endTime,
      availability.date
    );
    DateUtils.checkOverlappingSlots(availability.timeSlots, availability.date);
    await availability.save();
    return availability;
  }

  async updateSlotBookingStatus(
    doctorId: string,
    date: Date,
    startTime: string,
    isBooked: boolean
  ): Promise<void> {
    const startOfDay = DateUtils.startOfDayUTC(date);
    await AvailabilityModel.updateOne(
      { doctorId, date: startOfDay },
      {
        $set: {
          'timeSlots.$[slot].isBooked': isBooked,
        },
      },
      {
        arrayFilters: [{ 'slot.startTime': startTime }],
      }
    ).exec();
  }

  async getAvailableSlotsForSubscribedPatients(
    doctorId: string,
    date: Date
  ): Promise<Availability | null> {
    const startOfDay = DateUtils.startOfDayUTC(date);
    const endOfDay = DateUtils.endOfDayUTC(date);

    const availability = await AvailabilityModel.findOne({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).exec();

    if (!availability) {
      return null;
    }

    const availableSlots = availability.timeSlots.filter(
      slot => !slot.isBooked
    );

    if (availableSlots.length === 0) {
      return null;
    }

    return {
      ...availability.toObject(),
      timeSlots: availableSlots,
    };
  }
}
