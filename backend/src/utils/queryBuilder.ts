import { QueryParams } from '../types/authTypes';
import { ValidationError } from './errors';

export class QueryBuilder {
  static buildQuery(params: QueryParams) {
    const {
      search,
      status,
      specialty,
      isBlocked,
      isVerified,
      isSubscribed,
      dateFrom,
      dateTo,
    } = params;
    const query: any = {};

    if (search) {
      query.$or = [
        { 'patientId.name': { $regex: search, $options: 'i' } },
        { 'doctorId.name': { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    console.log(query)

    if (status) {
      query.status = status;
    }

    if (specialty) {
      query.speciality = specialty;
    }

    if (isBlocked !== undefined) {
      query.isBlocked = isBlocked;
    }

    if (isVerified !== undefined) {
      query.isVerified = isVerified;
    }

    if (isSubscribed !== undefined) {
      query.isSubscribed = isSubscribed;
    }

    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    return query;
  }

  static buildSort(params: QueryParams) {
    const { sortBy, sortOrder } = params;
    const sort: any = {};

    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    return sort;
  }

  static validateParams(params: QueryParams) {
    const page = parseInt(String(params.page)) || 1;
    const limit = parseInt(String(params.limit)) || 10;
    const { sortOrder } = params;
    
    if (page < 1) throw new ValidationError('Page must be at least 1');
    if (limit < 1 || limit > 100)
      throw new ValidationError('Limit must be between 1 and 100');
    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
      throw new ValidationError('Sort order must be "asc" or "desc"');
    }

    return { page, limit };
  }
}
