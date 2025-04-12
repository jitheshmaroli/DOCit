import { Availability } from '../../core/entities/Availability';
import { IAvailabilityRepository } from '../../core/interfaces/repositories/IAvailabilityRepository';
import { AvailabilityModel } from '../database/models/AvailabilityModel';

export class AvailabilityRepository implements IAvailabilityRepository {
  async create(availability: Availability): Promise<Availability> {
    const newAvailability = new AvailabilityModel(availability);
    return newAvailability.save();
  }

  async findById(id: string): Promise<Availability | null> {
    return AvailabilityModel.findById(id).exec();
  }

  async findByDoctorAndDate(
    doctorId: string,
    date: Date
  ): Promise<Availability | null> {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
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
      date: { $gte: startDate, $lte: endDate },
    }).exec();
  }

  async update(
    id: string,
    updates: Partial<Availability>
  ): Promise<Availability | null> {
    return AvailabilityModel.findByIdAndUpdate(id, updates, {
      new: true,
    }).exec();
  }

  async delete(id: string): Promise<void> {
    await AvailabilityModel.findByIdAndDelete(id).exec();
  }
}
