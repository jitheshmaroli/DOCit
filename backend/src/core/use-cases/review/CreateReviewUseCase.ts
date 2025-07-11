import { ConflictError, ValidationError } from '../../../utils/errors';
import { Review } from '../../entities/Review';
import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';
import { IReviewRepository } from '../../interfaces/repositories/IReviewRepository';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';

export class CreateReviewUseCase {
  constructor(
    private reviewRepository: IReviewRepository,
    private appointmentRepository: IAppointmentRepository,
    private doctorRepository: IDoctorRepository
  ) {}

  async execute(
    patientId: string,
    doctorId: string,
    appointmentId: string,
    rating: number,
    comment: string
  ): Promise<Review> {
    // Semantic validation: Check appointment exists and is completed
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new ValidationError('Appointment not found');
    }
    if (appointment.status !== 'completed') {
      throw new ValidationError('Cannot review an appointment that is not completed');
    }

    // Validate patient ownership
    if (typeof appointment.patientId === 'string' && appointment.patientId !== patientId) {
      throw new ValidationError('Unauthorized: Patient does not match appointment');
    }

    // Check for existing review
    const existingReview = await this.reviewRepository.findByAppointmentId(appointmentId);
    if (existingReview) {
      throw new ConflictError('A review for this appointment already exists');
    }

    // Create review
    const newReview: Review = {
      patientId,
      doctorId,
      appointmentId,
      rating,
      comment,
    };

    const createdReview = await this.reviewRepository.create(newReview);

    // Update appointment to mark it as reviewed
    await this.appointmentRepository.update(appointmentId, { hasReview: true });

    // Update doctor's average rating and reviewIds
    const reviews = await this.reviewRepository.findByDoctorId(doctorId);
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    await this.doctorRepository.update(doctorId, {
      averageRating,
      reviewIds: [...(reviews.map((r) => r._id!).filter((id) => id) as string[]), createdReview._id!],
    });

    return createdReview;
  }
}
