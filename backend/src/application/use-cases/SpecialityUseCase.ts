import { ISpecialityUseCase } from '../../core/interfaces/use-cases/ISpecialityUseCase';
import { ISpecialityRepository } from '../../core/interfaces/repositories/ISpecialityRepository';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { IValidatorService } from '../../core/interfaces/services/IValidatorService';
import { QueryParams } from '../../types/authTypes';
import { ValidationError, NotFoundError } from '../../utils/errors';
import {
  AddSpecialityRequestDTO,
  UpdateSpecialityRequestDTO,
  SpecialityResponseDTO,
  PaginatedSpecialityResponseDTO,
} from '../dtos/SpecialityDTOs';
import { SpecialityMapper } from '../mappers/SpecialityMapper';

export class SpecialityUseCase implements ISpecialityUseCase {
  constructor(
    private _specialityRepository: ISpecialityRepository,
    private doctorRepository: IDoctorRepository,
    private _validatorService: IValidatorService
  ) {}

  async addSpeciality(dto: AddSpecialityRequestDTO): Promise<SpecialityResponseDTO> {
    // Validations
    this._validatorService.validateRequiredFields({ name: dto.name });
    this._validatorService.validateLength(dto.name, 1, 100);

    const existingSpeciality = await this._specialityRepository.findByName(dto.name);
    if (existingSpeciality) {
      throw new ValidationError('Speciality with this name already exists');
    }

    const newSpeciality = SpecialityMapper.toSpecialityEntity(dto);

    const createdSpeciality = await this._specialityRepository.create(newSpeciality);
    return SpecialityMapper.toSpecialityResponseDTO(createdSpeciality);
  }

  async updateSpeciality(specialityId: string, updates: UpdateSpecialityRequestDTO): Promise<SpecialityResponseDTO> {
    // Validations
    this._validatorService.validateRequiredFields({ specialityId });
    this._validatorService.validateIdFormat(specialityId);
    if (updates.name) {
      this._validatorService.validateLength(updates.name, 1, 100);
    }

    const speciality = await this._specialityRepository.findById(specialityId);
    if (!speciality) {
      throw new NotFoundError('Speciality not found');
    }

    if (updates.name && updates.name !== speciality.name) {
      const existingSpeciality = await this._specialityRepository.findByName(updates.name);
      if (existingSpeciality) {
        throw new ValidationError('Speciality with this name already exists');
      }
    }

    const updatedSpeciality = await this._specialityRepository.update(specialityId, {
      ...updates,
      updatedAt: new Date(),
    });
    if (!updatedSpeciality) {
      throw new NotFoundError('Failed to update speciality');
    }
    return SpecialityMapper.toSpecialityResponseDTO(updatedSpeciality);
  }

  async deleteSpeciality(specialityId: string): Promise<void> {
    // Validate specialityId
    this._validatorService.validateRequiredFields({ specialityId });
    this._validatorService.validateIdFormat(specialityId);

    const speciality = await this._specialityRepository.findById(specialityId);
    if (!speciality) {
      throw new NotFoundError('Speciality not found');
    }

    const doctors = await this.doctorRepository.findBySpeciality(specialityId);
    if (doctors.length > 0) {
      throw new ValidationError('Cannot delete speciality with associated doctors');
    }

    await this._specialityRepository.delete(specialityId);
  }

  async getSpecialities(): Promise<SpecialityResponseDTO[]> {
    const specialities = await this._specialityRepository.findAll();
    return specialities.map(SpecialityMapper.toSpecialityResponseDTO);
  }

  async getSpecialitiesWithQuery(params: QueryParams): Promise<PaginatedSpecialityResponseDTO> {
    const { data, totalItems } = await this._specialityRepository.findAllWithQuery(params);
    return SpecialityMapper.toPaginatedResponseDTO(data, totalItems, params);
  }

  async getAllSpecialities(): Promise<SpecialityResponseDTO[]> {
    const specialities = await this._specialityRepository.findAll();
    return specialities.map(SpecialityMapper.toSpecialityResponseDTO);
  }
}
