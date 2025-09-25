import mongoose, { FilterQuery } from 'mongoose';
import { IPatientRepository } from '../../core/interfaces/repositories/IPatientRepository';
import { Patient } from '../../core/entities/Patient';
import { BaseRepository } from './BaseRepository';
import { PatientModel } from '../database/models/PatientModel';
import { QueryParams, PaginatedResponse } from '../../types/authTypes';
import { ValidationError } from '../../utils/errors';

export class PatientRepository extends BaseRepository<Patient> implements IPatientRepository {
  constructor() {
    super(PatientModel);
  }

  async findByEmail(email: string): Promise<Patient | null> {
    const patient = await this.model.findOne({ email, isBlocked: false }).exec();
    return patient ? (patient.toObject() as Patient) : null;
  }

  async findOne(query: FilterQuery<Patient>): Promise<Patient | null> {
    const patient = await this.model.findOne(query).exec();
    return patient ? (patient.toObject() as Patient) : null;
  }

  async findAllWithQuery(params: QueryParams & { ids?: string[] }): Promise<PaginatedResponse<Patient>> {
    const {
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isBlocked,
      isVerified,
      isSubscribed,
      ids,
    } = params;

    // Validate parameters
    const validatedPage = parseInt(String(page)) || 1;
    const validatedLimit = parseInt(String(limit)) || 10;
    if (validatedPage < 1) throw new ValidationError('Page must be at least 1');
    if (validatedLimit < 1 || validatedLimit > 100) throw new ValidationError('Limit must be between 1 and 100');
    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
      throw new ValidationError('Sort order must be "asc" or "desc"');
    }

    const query: FilterQuery<Patient> = {};

    // Handle search
    if (search) {
      query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    }

    // Handle boolean filters
    if (isBlocked !== undefined) {
      query.isBlocked = isBlocked;
    }
    if (isVerified !== undefined) {
      query.isVerified = isVerified;
    }
    if (isSubscribed !== undefined) {
      query.isSubscribed = isSubscribed;
    }

    // Handle ids filter
    if (ids && ids.length > 0) {
      query._id = { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) };
    }

    // Execute query
    const patients = await this.model
      .find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((validatedPage - 1) * validatedLimit)
      .limit(validatedLimit)
      .exec();

    const totalItems = await this.model.countDocuments(query).exec();
    const totalPages = Math.ceil(totalItems / validatedLimit);

    return {
      data: patients.map((patient) => patient.toObject() as Patient),
      totalPages,
      currentPage: validatedPage,
      totalItems,
    };
  }

  async updateSubscriptionStatus(patientId: string, isSubscribed: boolean): Promise<Patient | null> {
    const patient = await this.model.findByIdAndUpdate(patientId, { isSubscribed }, { new: true }).exec();
    return patient ? (patient.toObject() as Patient) : null;
  }
}
