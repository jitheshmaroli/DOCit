import { Review } from '../../entities/Review';
import { IReviewRepository } from '../../interfaces/repositories/IReviewRepository';

export class GetDoctorReviewsUseCase {
  constructor(private reviewRepository: IReviewRepository) {}

  async execute(doctorId: string): Promise<Review[]> {
    return await this.reviewRepository.findByDoctorId(doctorId);
  }
}
