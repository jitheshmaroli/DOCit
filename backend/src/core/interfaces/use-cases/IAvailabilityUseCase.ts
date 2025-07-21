import { Availability, TimeSlot } from '../../entities/Availability';

export interface IAvailabilityUseCase {
  setAvailability(
    doctorId: string,
    date: Date,
    timeSlots: TimeSlot[],
    isRecurring: boolean,
    recurringEndDate?: Date,
    recurringDays?: number[],
    forceCreate?: boolean
  ): Promise<{ availabilities: Availability | Availability[]; conflicts: { date: string; error: string }[] }>;
  getAvailability(doctorId: string, startDate: Date, endDate: Date): Promise<Availability[]>;
  getDoctorAvailability(
    doctorId: string,
    startDate: Date,
    endDate: Date,
    filterBooked: boolean
  ): Promise<Availability[]>;
  removeSlot(availabilityId: string, slotIndex: number, doctorId: string): Promise<Availability | null>;
  updateSlot(
    availabilityId: string,
    slotIndex: number,
    newSlot: { startTime: string; endTime: string },
    doctorId: string
  ): Promise<Availability | null>;
}
