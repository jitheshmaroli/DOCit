import { Availability } from '../../entities/Availability';

export interface IAvailabilityRepository {
  create(availability: Availability): Promise<Availability>;
  findById(id: string): Promise<Availability | null>;
  findByDoctorAndDate(
    doctorId: string,
    date: Date
  ): Promise<Availability | null>;
  findByDoctorAndDateRange(
    doctorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Availability[]>;
  update(id: string, updates: Partial<Availability>): Promise<void>;
  delete(id: string): Promise<void>;
  removeSlot(availabilityId: string, slotIndex: number): Promise<Availability | null>;
  updateSlot(
    availabilityId: string,
    slotIndex: number,
    newSlot: { startTime: string; endTime: string }
  ): Promise<Availability | null>;
}
