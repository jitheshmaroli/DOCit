import { QueryParams } from '../../../types/authTypes';
import { Patient } from '../../entities/Patient';
import { PaginatedPatientResponseDTO, PatientDTO } from '../PatientDTOs';
import { PatientSubscriptionMapper } from './PatientSubscriptionMapper';

export class PatientMapper {
  static toDTO(entity: Patient): PatientDTO {
    return {
      _id: entity._id,
      email: entity.email,
      name: entity.name,
      phone: entity.phone,
      age: entity.age,
      isSubscribed: entity.isSubscribed,
      isBlocked: entity.isBlocked,
      address: entity.address,
      pincode: entity.pincode,
      profilePicture: entity.profilePicture,
      profilePicturePublicId: entity.profilePicturePublicId,
      gender: entity.gender,
      createdAt: entity.createdAt?.toISOString(),
      updatedAt: entity.updatedAt?.toISOString(),
      lastSeen: entity.lastSeen?.toISOString(),
      subscribedPlans: entity.subscribedPlans?.map(PatientSubscriptionMapper.toDTO),
    };
  }

  static toEntity(dto: PatientDTO): Patient {
    return {
      _id: dto._id,
      email: dto.email,
      name: dto.name,
      phone: dto.phone,
      age: dto.age,
      isSubscribed: dto.isSubscribed,
      isBlocked: dto.isBlocked,
      address: dto.address,
      pincode: dto.pincode,
      profilePicture: dto.profilePicture,
      profilePicturePublicId: dto.profilePicturePublicId,
      gender: dto.gender,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
      lastSeen: dto.lastSeen ? new Date(dto.lastSeen) : undefined,
      subscribedPlans: dto.subscribedPlans?.map(PatientSubscriptionMapper.toEntity),
    };
  }

  static toPaginatedResponseDTO(
    data: PatientDTO[],
    totalItems: number,
    params: QueryParams
  ): PaginatedPatientResponseDTO {
    const { page = 1, limit = 10 } = params;
    const totalPages = Math.ceil(totalItems / limit);
    return {
      data,
      totalPages,
      currentPage: page,
      totalItems,
    };
  }
}
