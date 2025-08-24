import {
  SetAvailabilityRequestDTO,
  UpdateSlotRequestDTO,
  AvailabilityResponseDTO,
  SetAvailabilityResponseDTO,
} from '../AvailabilityDTOs';

export interface IAvailabilityUseCase {
  setAvailability(doctorId: string, dto: SetAvailabilityRequestDTO): Promise<SetAvailabilityResponseDTO>;
  getAvailability(doctorId: string, startDate: Date, endDate: Date): Promise<AvailabilityResponseDTO[]>;
  getDoctorAvailability(
    doctorId: string,
    startDate: Date,
    endDate: Date,
    filterBooked: boolean
  ): Promise<AvailabilityResponseDTO[]>;
  removeSlot(availabilityId: string, slotIndex: number, doctorId: string): Promise<AvailabilityResponseDTO | null>;
  updateSlot(
    availabilityId: string,
    slotIndex: number,
    newSlot: UpdateSlotRequestDTO,
    doctorId: string
  ): Promise<AvailabilityResponseDTO | null>;
}
