import { SubscriptionPlan } from '../../core/entities/SubscriptionPlan';
import {
  CreateSubscriptionPlanRequestDTO,
  SubscriptionPlanResponseDTO,
  PaginatedSubscriptionPlanResponseDTO,
} from '../dtos/SubscriptionPlanDTOs';
import { QueryParams } from '../../types/authTypes';

export class SubscriptionPlanMapper {
  static toSubscriptionPlanResponseDTO(entity: SubscriptionPlan): SubscriptionPlanResponseDTO {
    return {
      _id: entity._id?.toString() ?? '',
      doctorId: entity.doctorId?.toString() ?? '',
      name: entity.name,
      description: entity.description,
      price: entity.price,
      validityDays: entity.validityDays,
      appointmentCount: entity.appointmentCount,
      status: entity.status,
      doctorName: entity.doctorName,
      createdAt: entity.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: entity.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  static toSubscriptionPlanEntity(dto: CreateSubscriptionPlanRequestDTO, doctorId: string): SubscriptionPlan {
    return {
      doctorId,
      name: dto.name,
      description: dto.description,
      price: dto.price,
      validityDays: dto.validityDays,
      appointmentCount: dto.appointmentCount,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static toPaginatedResponseDTO(
    data: SubscriptionPlan[],
    totalItems: number,
    params: QueryParams
  ): PaginatedSubscriptionPlanResponseDTO {
    const { page = 1, limit = 10 } = params;
    const totalPages = Math.ceil(totalItems / limit);
    return {
      data: data.map(SubscriptionPlanMapper.toSubscriptionPlanResponseDTO),
      totalPages,
      currentPage: page,
      totalItems,
    };
  }
}
