import { Availability } from '../../core/entities/Availability';
import { IAvailabilityRepository } from '../../core/interfaces/repositories/IAvailabilityRepository';
import { AvailabilityModel } from '../database/models/AvailabilityModel';
import { DateUtils } from '../../utils/DateUtils';

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
    availability.timeSlots[slotIndex] = newSlot;
    DateUtils.validateTimeSlot(
      newSlot.startTime,
      newSlot.endTime,
      availability.date
    );
    DateUtils.checkOverlappingSlots(availability.timeSlots, availability.date);
    await availability.save();
    return availability;
  }
}
