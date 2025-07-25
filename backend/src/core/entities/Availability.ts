export interface TimeSlot {
  startTime: string;
  endTime: string;
  _id?: string;
  isBooked?: boolean;
}

export interface Availability {
  _id?: string;
  doctorId: string;
  date: Date;
  timeSlots: TimeSlot[];
  createdAt?: Date;
  updatedAt?: Date;
}
