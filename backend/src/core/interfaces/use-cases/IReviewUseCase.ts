import { Review } from '../../entities/Review';

export interface IReviewUseCase {
  createReview(
    patientId: string,
    doctorId: string,
    appointmentId: string,
    rating: number,
    comment: string
  ): Promise<Review>;
  getDoctorReviews(doctorId: string): Promise<Review[]>;
}
