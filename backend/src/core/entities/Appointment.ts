export interface Appointment {
  _id?: string;
  patientId: string | { _id: string; name?: string };
  doctorId: string | { _id: string; name?: string };
  date: Date;
  startTime: string;
  endTime: string;
  status: 'pending' | 'completed' | 'cancelled';
  isFreeBooking: boolean;
  bookingTime: Date;
  patientName?: string;
  doctorName?: string;
  createdAt?: Date;
  updatedAt?: Date;
  reminderSent?: boolean;
  cancellationReason?: string;
}
