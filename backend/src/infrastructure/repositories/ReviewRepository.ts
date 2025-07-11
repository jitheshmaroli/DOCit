import { Review } from '../../core/entities/Review';
import { IReviewRepository } from '../../core/interfaces/repositories/IReviewRepository';
import { ReviewModel } from '../database/models/ReviewModel';
import { BaseRepository } from './BaseRepository';

export class ReviewRepository extends BaseRepository<Review> implements IReviewRepository {
  constructor() {
    super(ReviewModel);
  }
  async findByAppointmentId(appointmentId: string): Promise<Review | null> {
    const review = await this.model.findOne({ appointmentId }).exec();
    return review ? (review.toObject() as Review) : null;
  }

  async findByDoctorId(doctorId: string): Promise<Review[]> {
    const reviews = await this.model.find({ doctorId }).populate('patientId', 'name').exec();
    return reviews as Review[];
  }
}
