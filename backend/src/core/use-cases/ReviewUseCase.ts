import { IReviewUseCase } from '../interfaces/use-cases/IReviewUseCase';
import { Review } from '../entities/Review';
import { IReviewRepository } from '../interfaces/repositories/IReviewRepository';
import { IAppointmentRepository } from '../interfaces/repositories/IAppointmentRepository';
import { IDoctorRepository } from '../interfaces/repositories/IDoctorRepository';
import { ValidationError, NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';

export class ReviewUseCase implements IReviewUseCase {
  constructor(
    private _reviewRepository: IReviewRepository,
    private _appointmentRepository: IAppointmentRepository,
    private _doctorRepository: IDoctorRepository
  ) {}

  async createReview(
    patientId: string,
    doctorId: string,
    appointmentId: string,
    rating: number,
    comment: string
  ): Promise<Review> {
    if (!patientId || !doctorId || !appointmentId || !rating) {
      logger.error('Missing required fields for creating review');
      throw new ValidationError('Patient ID, doctor ID, appointment ID, and rating are required');
    }

    if (rating < 1 || rating > 5) {
      logger.error(`Invalid rating value: ${rating}`);
      throw new ValidationError('Rating must be between 1 and 5');
    }

    const appointment = await this._appointmentRepository.findById(appointmentId);
    if (!appointment) {
      logger.error(`Appointment not found: ${appointmentId}`);
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.status !== 'completed') {
      logger.error(`Appointment ${appointmentId} is not completed`);
      throw new ValidationError('Reviews can only be created for completed appointments');
    }

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      logger.error(`Doctor not found: ${doctorId}`);
      throw new NotFoundError('Doctor not found');
    }

    const existingReview = await this._reviewRepository.findByAppointmentId(appointmentId);
    if (existingReview) {
      logger.error(`Review already exists for appointment ${appointmentId}`);
      throw new ValidationError('A review already exists for this appointment');
    }

    const review: Review = {
      patientId,
      doctorId,
      appointmentId,
      rating,
      comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const savedReview = await this._reviewRepository.create(review);

      await this._appointmentRepository.update(appointmentId, {
        hasReview: true,
        updatedAt: new Date(),
      });

      await this.updateDoctorAverageRating(doctorId);
      return savedReview;
    } catch (error) {
      logger.error(`Error creating review: ${(error as Error).message}`);
      throw new Error('Failed to create review');
    }
  }

  async getDoctorReviews(doctorId: string): Promise<Review[]> {
    if (!doctorId) {
      logger.error('Doctor ID is required for fetching reviews');
      throw new ValidationError('Doctor ID is required');
    }

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      logger.error(`Doctor not found: ${doctorId}`);
      throw new NotFoundError('Doctor not found');
    }

    return await this._reviewRepository.findByDoctorId(doctorId);
  }

  private async updateDoctorAverageRating(doctorId: string): Promise<void> {
    const reviews = await this._reviewRepository.findByDoctorId(doctorId);
    if (reviews.length === 0) {
      await this._doctorRepository.update(doctorId, { averageRating: 0 });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    try {
      await this._doctorRepository.update(doctorId, { averageRating, updatedAt: new Date() });
    } catch (error) {
      logger.error(`Error updating doctor average rating for doctor ${doctorId}: ${(error as Error).message}`);
      throw new Error('Failed to update doctor average rating');
    }
  }
}
