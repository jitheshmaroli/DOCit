import { Admin } from '../../core/entities/Admin';
import { AdminDTO } from '../dtos/AdminDTOs';

export class AdminMapper {
  static toDTO(entity: Admin): AdminDTO {
    return {
      _id: entity._id,
      email: entity.email,
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toEntity(dto: AdminDTO): Admin {
    return {
      _id: dto._id,
      email: dto.email,
      password: dto.password,
      name: dto.name,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }
}
