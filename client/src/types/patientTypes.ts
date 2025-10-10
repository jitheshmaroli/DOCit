export interface Review {
  _id?: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  rating: number;
  comment: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientApiError {
  message: string;
  status?: number;
}
