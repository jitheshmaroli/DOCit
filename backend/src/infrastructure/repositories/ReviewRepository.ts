import { Review } from '../../core/entities/Review';
import { IReviewRepository } from '../../core/interfaces/repositories/IReviewRepository';
import { ReviewModel } from '../database/models/ReviewModel';
import { BaseRepository } from './BaseRepository';

export class ReviewRepository extends BaseRepository<Review> implements IReviewRepository {
  constructor() {
    super(ReviewModel);
  }
  async findByAppointmentId(appointmentId: string): Promise<Review | null> {
    return await this.model.findOne({ appointmentId }).lean().exec();
  }

  async findByDoctorId(doctorId: string): Promise<Review[]> {
    return await this.model.find({ doctorId }).populate('patientId', 'name').lean().exec();
  }
}
