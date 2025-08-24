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
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
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
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }

  static toPaginatedResponseDTO(data: Doctor[], totalItems: number, params: QueryParams): PaginatedDoctorResponseDTO {
    const { page = 1, limit = 10 } = params;
    const totalPages = Math.ceil(totalItems / limit);
    return {
      data: data.map(DoctorMapper.toDTO),
      totalPages,
      currentPage: page,
      totalItems,
    };
  }
}
