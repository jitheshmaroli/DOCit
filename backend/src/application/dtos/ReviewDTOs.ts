export interface CreateReviewRequestDTO {
  appointmentId: string;
  doctorId: string;
  rating: number;
  comment: string;
}

export interface ReviewResponseDTO {
  _id: string;
  doctorId: string;
  patientId: string;
  appointmentId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}
