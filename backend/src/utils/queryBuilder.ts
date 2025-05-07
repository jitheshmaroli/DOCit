import { ValidationError } from './errors';
import mongoose from 'mongoose';
import logger from './logger';

export interface QueryParams {
  page?: number | string;
  limit?: number | string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  speciality?: string;
  isBlocked?: boolean | string;
  isVerified?: boolean | string;
  isSubscribed?: boolean | string;
  dateFrom?: string;
  dateTo?: string;
  doctorId?: string;
  patientId?: string;
  ageRange?: string;
  gender?: string;
}

export class QueryBuilder {
  static buildQuery(params: QueryParams, context: 'patient' | 'doctor' | 'appointment' = 'patient') {
    const {
      search,
      status,
      speciality,
      isBlocked,
      isVerified,
      isSubscribed,
      dateFrom,
      dateTo,
      doctorId,
      patientId,
      ageRange,
      gender,
    } = params;
    const query: any = {};

    if (search) {
      if (context === 'appointment') {
        query.$or = [
          { 'patientId.name': { $regex: search, $options: 'i' } },
          { 'doctorId.name': { $regex: search, $options: 'i' } },
        ];
      } else {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }
    }

    if (status) {
      query.status = status;
    }

    if (speciality && context === 'doctor') {
      query.specialityObjects = {
        $elemMatch: { name: speciality }
      };
    } else if (speciality && context !== 'appointment') {
      query.speciality = speciality;
    }

    if (isBlocked !== undefined) {
      query.isBlocked = isBlocked === 'true' || isBlocked === true;
    }

    if (isVerified !== undefined) {
      query.isVerified = isVerified === 'true' || isVerified === true;
    }

    if (isSubscribed !== undefined) {
      query.isSubscribed = isSubscribed === 'true' || isSubscribed === true;
    }

    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    if (doctorId && context === 'appointment') {
      query.doctorId = doctorId;
    }

    if (patientId && context === 'appointment') {
      query.patientId = patientId;
    }

    if (ageRange && context === 'doctor') {
      query.age = {};
      switch (ageRange) {
        case '0-30':
          query.age.$lte = '30';
          break;
        case '31-50':
          query.age.$gt = '30';
          query.age.$lte = '50';
          break;
        case '51+':
          query.age.$gt = '50';
          break;
      }
    }

    if (gender && context === 'doctor') {
      query.gender = gender;
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