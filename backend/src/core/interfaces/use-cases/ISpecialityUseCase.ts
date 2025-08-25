import { QueryParams } from '../../../types/authTypes';
import {
  AddSpecialityRequestDTO,
  UpdateSpecialityRequestDTO,
  SpecialityResponseDTO,
  PaginatedSpecialityResponseDTO,
} from '../SpecialityDTOs';

export interface ISpecialityUseCase {
  addSpeciality(dto: AddSpecialityRequestDTO): Promise<SpecialityResponseDTO>;
  updateSpeciality(specialityId: string, updates: UpdateSpecialityRequestDTO): Promise<SpecialityResponseDTO>;
  deleteSpeciality(specialityId: string): Promise<void>;
  getSpecialities(): Promise<SpecialityResponseDTO[]>;
  getSpecialitiesWithQuery(params: QueryParams): Promise<PaginatedSpecialityResponseDTO>;
  getAllSpecialities(): Promise<SpecialityResponseDTO[]>;
}
