import { ISpecialityUseCase } from '../interfaces/use-cases/ISpecialityUseCase';
import { ISpecialityRepository } from '../interfaces/repositories/ISpecialityRepository';
import { IDoctorRepository } from '../interfaces/repositories/IDoctorRepository';
import { QueryParams } from '../../types/authTypes';
import { ValidationError, NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';
import {
  AddSpecialityRequestDTO,
  UpdateSpecialityRequestDTO,
  SpecialityResponseDTO,
  PaginatedSpecialityResponseDTO,
} from '../interfaces/SpecialityDTOs';
import { SpecialityMapper } from '../interfaces/mappers/SpecialityMapper';

export class SpecialityUseCase implements ISpecialityUseCase {
  constructor(
    private _specialityRepository: ISpecialityRepository,
    private doctorRepository: IDoctorRepository
  ) {}

  async addSpeciality(dto: AddSpecialityRequestDTO): Promise<SpecialityResponseDTO> {
    if (!dto.name) {
      logger.error('Speciality name is required');
      throw new ValidationError('Speciality name is required');
    }

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
    if (!specialityId) {
      logger.error('Speciality ID is required for updating speciality');
      throw new ValidationError('Speciality ID is required');
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
    if (!specialityId) {
      logger.error('Speciality ID is required for deletion');
      throw new ValidationError('Speciality ID is required');
    }

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
    const { data, totalItems } = await this._specialityRepository.findAllWithQuery(params);
    return SpecialityMapper.toPaginatedResponseDTO(data, totalItems, params);
  }

  async getAllSpecialities(): Promise<SpecialityResponseDTO[]> {
    const specialities = await this._specialityRepository.findAll();
    return specialities.map(SpecialityMapper.toSpecialityResponseDTO);
  }
}
