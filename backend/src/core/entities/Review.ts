export interface Review {
  _id?: string;
  appointmentId?: string;
  doctorId?: string;
  patientId?: string;
  rating: number;
  comment: string;
  createdAt?: Date;
  updatedAt?: Date;
}
