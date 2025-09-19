import { Availability, TimeSlot } from '../../core/entities/Availability';
import { AvailabilityResponseDTO, TimeSlotDTO, SetAvailabilityRequestDTO } from '../dtos/AvailabilityDTOs';

export class AvailabilityMapper {
  static toAvailabilityResponseDTO(availability: Availability): AvailabilityResponseDTO {
    const dateIso = availability.date.toISOString();
    return {
      _id: availability._id?.toString() ?? '',
      doctorId: availability.doctorId?.toString() ?? '',
      date: dateIso,
      dateKey: new Date(dateIso).toISOString().split('T')[0], // 'YYYY-MM-DD'
      timeSlots: availability.timeSlots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: slot.isBooked,
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
