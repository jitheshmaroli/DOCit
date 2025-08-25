import { Speciality } from '../../entities/Speciality';
import {
  AddSpecialityRequestDTO,
  SpecialityResponseDTO,
  PaginatedSpecialityResponseDTO,
  UpdateSpecialityRequestDTO,
} from '../SpecialityDTOs';
import { QueryParams } from '../../../types/authTypes';

export class SpecialityMapper {
  static toSpecialityResponseDTO(entity: Speciality): SpecialityResponseDTO {
    return {
      _id: entity._id?.toString() ?? '',
      name: entity.name,
      createdAt: entity.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: entity.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  static toSpecialityEntity(dto: AddSpecialityRequestDTO | UpdateSpecialityRequestDTO): Speciality {
    return {
      name: dto.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static toPaginatedResponseDTO(
    data: Speciality[],
    totalItems: number,
    params: QueryParams
  ): PaginatedSpecialityResponseDTO {
    const { page = 1, limit = 10 } = params;
    const totalPages = Math.ceil(totalItems / limit);
    return {
      data: data.map(SpecialityMapper.toSpecialityResponseDTO),
      totalPages,
      currentPage: page,
      totalItems,
    };
  }
}
