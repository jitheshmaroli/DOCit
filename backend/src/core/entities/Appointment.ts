export interface Appointment {
  _id?: string;
  patientId: string;
  doctorId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  isFreeBooking: boolean;
  bookingTime: Date;
  patientName?: string;
  doctorName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
