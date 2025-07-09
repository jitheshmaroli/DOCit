// F:\DOCit\backend\src\core\use-cases\review\CreateReviewUseCase.ts
import { ConflictError, ValidationError } from '../../../utils/errors';
import { Review } from '../../entities/Review';
import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';
import { IReviewRepository } from '../../interfaces/repositories/IReviewRepository';

export class CreateReviewUseCase {
  constructor(
    private reviewRepository: IReviewRepository,
    private appointmentRepository: IAppointmentRepository // Fixed typo
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
    // if (appointment.patientId !== patientId) {
    //   throw new AuthenticationError('Unauthorized: Patient does not match appointment');
    // }

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

    return createdReview;
  }
}
