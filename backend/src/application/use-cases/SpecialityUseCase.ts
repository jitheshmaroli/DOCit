import { ISpecialityUseCase } from '../../core/interfaces/use-cases/ISpecialityUseCase';
import { ISpecialityRepository } from '../../core/interfaces/repositories/ISpecialityRepository';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { IValidatorService } from '../../core/interfaces/services/IValidatorService';
import { QueryParams } from '../../types/authTypes';
import { ValidationError, NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';
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
    // Validate required fields
    this._validatorService.validateRequiredFields({ name: dto.name });

    // Validate name length
    this._validatorService.validateLength(dto.name, 1, 100);

    const existingSpeciality = await this._specialityRepository.findByName(dto.name);
    if (existingSpeciality) {
      logger.error(`Speciality with name ${dto.name} already exists`);
      throw new ValidationError('Speciality with this name already exists');
    }

    const newSpeciality = SpecialityMapper.toSpecialityEntity(dto);

    try {
      const createdSpeciality = await this._specialityRepository.create(newSpeciality);
      return SpecialityMapper.toSpecialityResponseDTO(createdSpeciality);
    } catch (error) {
      logger.error(`Error creating speciality: ${(error as Error).message}`);
      throw new Error('Failed to create speciality');
    }
  }

  async updateSpeciality(specialityId: string, updates: UpdateSpecialityRequestDTO): Promise<SpecialityResponseDTO> {
    // Validate specialityId
    this._validatorService.validateRequiredFields({ specialityId });
    this._validatorService.validateIdFormat(specialityId);

    // Validate name if provided
    if (updates.name) {
      this._validatorService.validateLength(updates.name, 1, 100);
    }

    const speciality = await this._specialityRepository.findById(specialityId);
    if (!speciality) {
      logger.error(`Speciality not found: ${specialityId}`);
      throw new NotFoundError('Speciality not found');
    }

    if (updates.name && updates.name !== speciality.name) {
      const existingSpeciality = await this._specialityRepository.findByName(updates.name);
      if (existingSpeciality) {
        logger.error(`Speciality with name ${updates.name} already exists`);
        throw new ValidationError('Speciality with this name already exists');
      }
    }

    try {
      const updatedSpeciality = await this._specialityRepository.update(specialityId, {
        ...updates,
        updatedAt: new Date(),
      });
      if (!updatedSpeciality) {
        logger.error(`Failed to update speciality ${specialityId}`);
        throw new NotFoundError('Failed to update speciality');
      }
      return SpecialityMapper.toSpecialityResponseDTO(updatedSpeciality);
    } catch (error) {
      logger.error(`Error updating speciality ${specialityId}: ${(error as Error).message}`);
      throw new Error('Failed to update speciality');
    }
  }

  async deleteSpeciality(specialityId: string): Promise<void> {
    // Validate specialityId
    this._validatorService.validateRequiredFields({ specialityId });
    this._validatorService.validateIdFormat(specialityId);

    const speciality = await this._specialityRepository.findById(specialityId);
    if (!speciality) {
      logger.error(`Speciality not found: ${specialityId}`);
      throw new NotFoundError('Speciality not found');
    }

    const doctors = await this.doctorRepository.findBySpeciality(specialityId);
    if (doctors.length > 0) {
      logger.error(`Cannot delete speciality ${specialityId} as it is associated with ${doctors.length} doctors`);
      throw new ValidationError('Cannot delete speciality with associated doctors');
    }

    try {
      await this._specialityRepository.delete(specialityId);
    } catch (error) {
      logger.error(`Error deleting speciality ${specialityId}: ${(error as Error).message}`);
      throw new Error('Failed to delete speciality');
    }
  }

  async getSpecialities(): Promise<SpecialityResponseDTO[]> {
    const specialities = await this._specialityRepository.findAll();
    return specialities.map(SpecialityMapper.toSpecialityResponseDTO);
  }

  async getSpecialitiesWithQuery(params: QueryParams): Promise<PaginatedSpecialityResponseDTO> {
    // No specific validation for QueryParams, as it's typically flexible
    const { data, totalItems } = await this._specialityRepository.findAllWithQuery(params);
    return SpecialityMapper.toPaginatedResponseDTO(data, totalItems, params);
  }

  async getAllSpecialities(): Promise<SpecialityResponseDTO[]> {
    const specialities = await this._specialityRepository.findAll();
    return specialities.map(SpecialityMapper.toSpecialityResponseDTO);
  }
}
