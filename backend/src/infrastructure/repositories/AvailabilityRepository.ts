import moment from 'moment';
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
    return AvailabilityModel.findOne({
      doctorId,
      date: {
        $gte: moment(date).startOf('day').toDate(),
        $lte: moment(date).endOf('day').toDate(),
      },
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
  ): Promise<void> {
    await AvailabilityModel.findByIdAndUpdate(id, updates).exec();
  }

  async delete(id: string): Promise<void> {
    await AvailabilityModel.findByIdAndDelete(id).exec();
  }
}
