import { CreateReviewRequestDTO, ReviewResponseDTO } from '../ReviewDTOs';

export interface IReviewUseCase {
  createReview(patientId: string, dto: CreateReviewRequestDTO): Promise<ReviewResponseDTO>;
  getDoctorReviews(doctorId: string): Promise<ReviewResponseDTO[]>;
}
