import { CreateReviewRequestDTO, ReviewResponseDTO } from '../../../application/dtos/ReviewDTOs';

export interface IReviewUseCase {
  createReview(patientId: string, dto: CreateReviewRequestDTO): Promise<ReviewResponseDTO>;
  getDoctorReviews(doctorId: string): Promise<ReviewResponseDTO[]>;
}
