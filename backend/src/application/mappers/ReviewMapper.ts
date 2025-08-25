import { Review } from '../../core/entities/Review';
import { CreateReviewRequestDTO, ReviewResponseDTO } from '../dtos/ReviewDTOs';

export class ReviewMapper {
  static toReviewResponseDTO(entity: Review): ReviewResponseDTO {
    return {
      _id: entity._id?.toString() ?? '',
      doctorId: entity.doctorId ?? '',
      patientId: entity.patientId ?? '',
      appointmentId: entity.appointmentId ?? '',
      rating: entity.rating,
      comment: entity.comment,
      createdAt: entity.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: entity.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  static toReviewEntity(dto: CreateReviewRequestDTO, patientId: string): Review {
    return {
      patientId,
      doctorId: dto.doctorId,
      appointmentId: dto.appointmentId,
      rating: dto.rating,
      comment: dto.comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
