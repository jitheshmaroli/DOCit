import { Availability, TimeSlot } from '../../core/entities/Availability';
import { AvailabilityResponseDTO, TimeSlotDTO, SetAvailabilityRequestDTO } from '../dtos/AvailabilityDTOs';

export class AvailabilityMapper {
  static toAvailabilityResponseDTO(availability: Availability): AvailabilityResponseDTO {
    return {
      _id: availability._id?.toString() ?? '',
      doctorId: availability.doctorId,
      date: availability.date.toISOString(),
      timeSlots: availability.timeSlots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: slot.isBooked ?? false,
      })),
    };
  }

  static toAvailabilityEntity(dto: SetAvailabilityRequestDTO, doctorId: string): Availability {
    return {
      doctorId,
      date: new Date(dto.date),
      timeSlots: dto.timeSlots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: false,
      })),
    };
  }

  static toTimeSlotEntity(dto: TimeSlotDTO): TimeSlot {
    return {
      startTime: dto.startTime,
      endTime: dto.endTime,
      isBooked: dto.isBooked,
    };
  }
}
