import { Review } from '../../entities/Review';
import { IBaseRepository } from './IBaseRepository';

export interface IReviewRepository extends IBaseRepository<Review> {
  findByAppointmentId(appointmentId: string): Promise<Review | null>;
  findByDoctorId(doctorId: string): Promise<Review[]>;
}
