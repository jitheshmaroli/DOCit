export interface TimeSlot {
  startTime: string;
  endTime: string;
  isBooked?: boolean;
  _id?: string;
}

export interface Availability {
  _id?: string;
  date: string;
  dateKey: string;
  timeSlots: TimeSlot[];
  doctorId?: string;
}

export interface SetAvailabilityResponse {
  availabilities: Availability[];
  conflicts: { date: string; error: string }[];
}
