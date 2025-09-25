import { IReviewUseCase } from '../../core/interfaces/use-cases/IReviewUseCase';
import { IReviewRepository } from '../../core/interfaces/repositories/IReviewRepository';
import { IAppointmentRepository } from '../../core/interfaces/repositories/IAppointmentRepository';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { IValidatorService } from '../../core/interfaces/services/IValidatorService';
import { ValidationError, NotFoundError } from '../../utils/errors';
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
    // Validations
    this._validatorService.validateRequiredFields({
      patientId: dto.patientId,
      doctorId: dto.doctorId,
      appointmentId: dto.appointmentId,
      rating: dto.rating,
    });
    this._validatorService.validateIdFormat(dto.patientId);
    this._validatorService.validateIdFormat(dto.doctorId);
    this._validatorService.validateIdFormat(dto.appointmentId);

    if (dto.rating < 1 || dto.rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    if (dto.comment) {
      this._validatorService.validateLength(dto.comment, 1, 1000);
    }

    const appointment = await this._appointmentRepository.findById(dto.appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    this._validatorService.validateEnum(appointment.status, ['completed']);

    const doctor = await this._doctorRepository.findById(dto.doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    const existingReview = await this._reviewRepository.findByAppointmentId(dto.appointmentId);
    if (existingReview) {
      throw new ValidationError('A review already exists for this appointment');
    }

    const review = ReviewMapper.toReviewEntity(dto);

    const savedReview = await this._reviewRepository.create(review);

    await this._appointmentRepository.update(dto.appointmentId, {
      hasReview: true,
      updatedAt: new Date(),
    });

    await this.updateDoctorAverageRating(dto.doctorId);
    return ReviewMapper.toReviewResponseDTO(savedReview);
  }

  async getDoctorReviews(doctorId: string): Promise<ReviewResponseDTO[]> {
    // Validations
    this._validatorService.validateRequiredFields({ doctorId });
    this._validatorService.validateIdFormat(doctorId);

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    const reviews = await this._reviewRepository.findByDoctorId(doctorId);
    return reviews.map(ReviewMapper.toReviewResponseDTO);
  }

  private async updateDoctorAverageRating(doctorId: string): Promise<void> {
    // Validations
    this._validatorService.validateIdFormat(doctorId);

    const reviews = await this._reviewRepository.findByDoctorId(doctorId);
    if (reviews.length === 0) {
      await this._doctorRepository.update(doctorId, { averageRating: 0 });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await this._doctorRepository.update(doctorId, { averageRating, updatedAt: new Date() });
  }
}
