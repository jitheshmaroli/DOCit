import { Availability } from '../../entities/Availability';
import { IBaseRepository } from './IBaseRepository';

export interface IAvailabilityRepository extends IBaseRepository<Availability> {
  findByDoctorAndDate(doctorId: string, date: Date): Promise<Availability | null>;
  findByDoctorAndDateRange(doctorId: string, startDate: Date, endDate: Date): Promise<Availability[]>;
  findByDoctorAndDateRangeWithUnbookedSlots(doctorId: string, startDate: Date, endDate: Date): Promise<Availability[]>;
  removeSlot(availabilityId: string, slotIndex: number): Promise<Availability | null>;
  updateSlot(
    availabilityId: string,
    slotIndex: number,
    newSlot: { startTime: string; endTime: string }
  ): Promise<Availability | null>;
  updateSlotBookingStatus(doctorId: string, date: Date, startTime: string, isBooked: boolean): Promise<void>;
}
