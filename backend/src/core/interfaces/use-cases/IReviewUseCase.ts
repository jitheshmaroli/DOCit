import { CreateReviewRequestDTO, ReviewResponseDTO } from '../../../application/dtos/ReviewDTOs';

export interface IReviewUseCase {
  createReview(dto: CreateReviewRequestDTO): Promise<ReviewResponseDTO>;
  getDoctorReviews(doctorId: string): Promise<ReviewResponseDTO[]>;
}
