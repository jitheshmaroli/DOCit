import { IReviewUseCase } from '../../core/interfaces/use-cases/IReviewUseCase';
import { IReviewRepository } from '../../core/interfaces/repositories/IReviewRepository';
import { IAppointmentRepository } from '../../core/interfaces/repositories/IAppointmentRepository';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { IValidatorService } from '../../core/interfaces/services/IValidatorService';
import { ValidationError, NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';
import { CreateReviewRequestDTO, ReviewResponseDTO } from '../dtos/ReviewDTOs';
import { ReviewMapper } from '../mappers/ReviewMapper';

export class ReviewUseCase implements IReviewUseCase {
  constructor(
    private _reviewRepository: IReviewRepository,
    private _appointmentRepository: IAppointmentRepository,
    private _doctorRepository: IDoctorRepository,
    private _validatorService: IValidatorService
  ) {}

  async createReview(dto: CreateReviewRequestDTO): Promise<ReviewResponseDTO> {
    // Validate required fields
    this._validatorService.validateRequiredFields({
      patientId: dto.patientId,
      doctorId: dto.doctorId,
      appointmentId: dto.appointmentId,
      rating: dto.rating,
    });

    // Validate IDs
    this._validatorService.validateIdFormat(dto.patientId);
    this._validatorService.validateIdFormat(dto.doctorId);
    this._validatorService.validateIdFormat(dto.appointmentId);

    // Validate rating
    if (dto.rating < 1 || dto.rating > 5) {
      logger.error(`Invalid rating value: ${dto.rating}`);
      throw new ValidationError('Rating must be between 1 and 5');
    }

    // Validate comment if provided
    if (dto.comment) {
      this._validatorService.validateLength(dto.comment, 1, 1000);
    }

    const appointment = await this._appointmentRepository.findById(dto.appointmentId);
    if (!appointment) {
      logger.error(`Appointment not found: ${dto.appointmentId}`);
      throw new NotFoundError('Appointment not found');
    }

    // Validate appointment status
    this._validatorService.validateEnum(appointment.status, ['completed']);

    const doctor = await this._doctorRepository.findById(dto.doctorId);
    if (!doctor) {
      logger.error(`Doctor not found: ${dto.doctorId}`);
      throw new NotFoundError('Doctor not found');
    }

    const existingReview = await this._reviewRepository.findByAppointmentId(dto.appointmentId);
    if (existingReview) {
      logger.error(`Review already exists for appointment ${dto.appointmentId}`);
      throw new ValidationError('A review already exists for this appointment');
    }

    const review = ReviewMapper.toReviewEntity(dto);

    try {
      const savedReview = await this._reviewRepository.create(review);

      await this._appointmentRepository.update(dto.appointmentId, {
        hasReview: true,
        updatedAt: new Date(),
      });

      await this.updateDoctorAverageRating(dto.doctorId);
      return ReviewMapper.toReviewResponseDTO(savedReview);
    } catch (error) {
      logger.error(`Error creating review: ${(error as Error).message}`);
      throw new Error('Failed to create review');
    }
  }

  async getDoctorReviews(doctorId: string): Promise<ReviewResponseDTO[]> {
    // Validate doctorId
    this._validatorService.validateRequiredFields({ doctorId });
    this._validatorService.validateIdFormat(doctorId);

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      logger.error(`Doctor not found: ${doctorId}`);
      throw new NotFoundError('Doctor not found');
    }

    const reviews = await this._reviewRepository.findByDoctorId(doctorId);
    logger.info('usecase reviews:', reviews);
    return reviews.map(ReviewMapper.toReviewResponseDTO);
  }

  private async updateDoctorAverageRating(doctorId: string): Promise<void> {
    // Validate doctorId
    this._validatorService.validateIdFormat(doctorId);

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
