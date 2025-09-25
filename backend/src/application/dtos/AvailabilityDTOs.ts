export interface TimeSlotDTO {
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface SetAvailabilityRequestDTO {
  date: string;
  timeSlots: Array<{ startTime: string; endTime: string }>;
  isRecurring: boolean;
  recurringEndDate?: string;
  recurringDays: number[];
}

export interface UpdateSlotRequestDTO {
  startTime: string;
  endTime: string;
}

export interface AvailabilityResponseDTO {
  _id: string;
  doctorId: string;
  date: string;
  dateKey: string;
  timeSlots: Array<{ startTime: string; endTime: string; isBooked: boolean }>;
}

export interface SetAvailabilityResponseDTO {
  availabilities: AvailabilityResponseDTO[];
  conflicts: { date: string; error: string }[];
}
