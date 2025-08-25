import { QueryParams } from '../../../types/authTypes';
import { Doctor } from '../../entities/Doctor';
import { DoctorDTO, PaginatedDoctorResponseDTO } from '../DoctorDTOs';

export class DoctorMapper {
  static toDTO(entity: Doctor): DoctorDTO {
    return {
      _id: entity._id,
      email: entity.email,
      name: entity.name,
      phone: entity.phone,
      qualifications: entity.qualifications,
      licenseNumber: entity.licenseNumber,
      location: entity.location,
      speciality: entity.speciality,
      totalExperience: entity.totalExperience,
      experiences: entity.experiences,
      allowFreeBooking: entity.allowFreeBooking,
      gender: entity.gender,
      isVerified: entity.isVerified,
      isBlocked: entity.isBlocked,
      profilePicture: entity.profilePicture,
      profilePicturePublicId: entity.profilePicturePublicId,
      licenseProof: entity.licenseProof,
      licenseProofPublicId: entity.licenseProofPublicId,
      averageRating: entity.averageRating,
      createdAt: entity.createdAt?.toISOString(),
      updatedAt: entity.updatedAt?.toISOString(),
      lastSeen: entity.lastSeen?.toISOString(),
    };
  }

  static toEntity(dto: DoctorDTO): Doctor {
    return {
      _id: dto._id,
      email: dto.email,
      name: dto.name,
      phone: dto.phone,
      qualifications: dto.qualifications,
      licenseNumber: dto.licenseNumber,
      location: dto.location,
      speciality: dto.speciality,
      totalExperience: dto.totalExperience,
      experiences: dto.experiences,
      allowFreeBooking: dto.allowFreeBooking,
      gender: dto.gender,
      isVerified: dto.isVerified,
      isBlocked: dto.isBlocked,
      profilePicture: dto.profilePicture,
      profilePicturePublicId: dto.profilePicturePublicId,
      licenseProof: dto.licenseProof,
      licenseProofPublicId: dto.licenseProofPublicId,
      averageRating: dto.averageRating,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
      lastSeen: dto.lastSeen ? new Date(dto.lastSeen) : undefined,
    };
  }

  static toPaginatedResponseDTO(
    data: DoctorDTO[],
    totalItems: number,
    params: QueryParams
  ): PaginatedDoctorResponseDTO {
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
