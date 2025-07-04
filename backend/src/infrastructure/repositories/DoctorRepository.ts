import mongoose, { FilterQuery, PipelineStage } from 'mongoose';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { Doctor } from '../../core/entities/Doctor';
import { BaseRepository } from './BaseRepository';
import { DoctorModel } from '../database/models/DoctorModel';
import { SubscriptionPlanModel } from '../database/models/SubscriptionPlanModel';
import { QueryParams, PaginatedResponse } from '../../types/authTypes';
import { ValidationError } from '../../utils/errors';
import logger from '../../utils/logger';
import { SpecialityModel } from '../database/models/SpecialityModel';
import { DateUtils } from '../../utils/DateUtils';

export class DoctorRepository extends BaseRepository<Doctor> implements IDoctorRepository {
  constructor() {
    super(DoctorModel);
  }

  async findByEmail(email: string): Promise<Doctor | null> {
    const doctor = await this.model.findOne({ email, isBlocked: false }).exec();
    return doctor ? (doctor.toObject() as Doctor) : null;
  }

  async getDoctorDetails(doctorId: string): Promise<Doctor | null> {
    if (!mongoose.Types.ObjectId.isValid(doctorId)) return null;
    const doctor = await this.model.findById(doctorId).select('-password').exec();
    return doctor ? (doctor.toObject() as Doctor) : null;
  }

  async findByCriteria(criteria: Partial<Doctor>): Promise<Doctor[]> {
    const doctors = await this.model.find(criteria).exec();
    return doctors.map((doc) => doc.toObject() as Doctor);
  }

  async findBySpeciality(specialityId: string): Promise<Doctor[]> {
    const doctors = await this.model.find({ speciality: specialityId }).exec();
    return doctors.map((doc) => doc.toObject() as Doctor);
  }

  async findVerified(params: QueryParams): Promise<PaginatedResponse<Doctor>> {
    const {
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isBlocked,
      isVerified = true,
      speciality,
      experience,
      gender,
      availabilityStart,
      availabilityEnd,
    } = params;

    // Validate parameters
    const validatedPage = parseInt(String(page)) || 1;
    const validatedLimit = parseInt(String(limit)) || 10;
    if (validatedPage < 1) throw new ValidationError('Page must be at least 1');
    if (validatedLimit < 1 || validatedLimit > 100) throw new ValidationError('Limit must be between 1 and 100');
    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
      throw new ValidationError('Sort order must be "asc" or "desc"');
    }

    const query: FilterQuery<Doctor> = { isVerified: true, isBlocked: false };

    // Handle search
    if (search) {
      query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    }

    // Handle boolean filters
    if (isBlocked !== undefined) {
      query.isBlocked = String(isBlocked) === 'true';
    }

    if (isVerified !== undefined) {
      query.isVerified = String(isVerified) === 'true';
    }

    // Handle speciality
    if (speciality) {
      const specialityIds = await SpecialityModel.find({ name: { $regex: speciality, $options: 'i' } })
        .select('_id')
        .exec();
      query.speciality = { $in: specialityIds.map((s) => s._id) };
    }

    // Handle experience
    if (experience) {
      query.experience = {};
      switch (experience) {
        case '0-5':
          query.experience.$lte = 5;
          break;
        case '6-10':
          query.experience.$gt = 5;
          query.experience.$lte = 10;
          break;
        case '11+':
          query.experience.$gt = 10;
          break;
      }
    }

    // Handle gender
    if (gender) {
      query.gender = gender;
    }

    const pipeline: PipelineStage[] = [{ $match: query }];

    // Handle availability
    if (availabilityStart && availabilityEnd) {
      try {
        const startDate = DateUtils.startOfDayUTC(DateUtils.parseToUTC(availabilityStart));
        const endDate = DateUtils.endOfDayUTC(DateUtils.parseToUTC(availabilityEnd));
        logger.debug('Availability filter dates:', {
          availabilityStart,
          availabilityEnd,
          startDate: DateUtils.formatToISO(startDate),
          endDate: DateUtils.formatToISO(endDate),
        });

        pipeline.push({
          $lookup: {
            from: 'availabilities',
            let: { doctorId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: [{ $toObjectId: '$doctorId' }, '$$doctorId'] }, // Convert doctorId to ObjectId
                      { $gte: ['$date', startDate] },
                      { $lte: ['$date', endDate] },
                      {
                        $gt: [
                          {
                            $size: {
                              $filter: {
                                input: '$timeSlots',
                                as: 'slot',
                                cond: { $eq: ['$$slot.isBooked', false] },
                              },
                            },
                          },
                          0,
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'availabilities',
          },
        });
        pipeline.push({
          $match: {
            'availabilities.0': { $exists: true },
          },
        });
      } catch (error) {
        logger.error('Error parsing availability dates:', error);
        throw new ValidationError('Invalid availability date format');
      }
    }

    pipeline.push(
      {
        $lookup: {
          from: 'specialities',
          localField: 'speciality',
          foreignField: '_id',
          as: 'specialityObjects',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          qualifications: 1,
          licenseNumber: 1,
          location: 1,
          speciality: {
            $map: {
              input: '$specialityObjects',
              as: 'spec',
              in: '$$spec.name',
            },
          },
          experience: 1,
          allowFreeBooking: 1,
          age: 1,
          gender: 1,
          isVerified: 1,
          isBlocked: 1,
          profilePicture: 1,
          profilePicturePublicId: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
      { $skip: (validatedPage - 1) * validatedLimit },
      { $limit: validatedLimit }
    );

    const countPipeline: PipelineStage[] = [
      { $match: query },
      ...(availabilityStart && availabilityEnd
        ? [
            {
              $lookup: {
                from: 'availabilities',
                let: { doctorId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: [{ $toObjectId: '$doctorId' }, '$$doctorId'] }, // Convert doctorId to ObjectId
                          { $gte: ['$date', DateUtils.startOfDayUTC(DateUtils.parseToUTC(availabilityStart))] },
                          { $lte: ['$date', DateUtils.endOfDayUTC(DateUtils.parseToUTC(availabilityEnd))] },
                          {
                            $gt: [
                              {
                                $size: {
                                  $filter: {
                                    input: '$timeSlots',
                                    as: 'slot',
                                    cond: { $eq: ['$$slot.isBooked', false] },
                                  },
                                },
                              },
                              0,
                            ],
                          },
                        ],
                      },
                    },
                  },
                ],
                as: 'availabilities',
              },
            },
            {
              $match: {
                'availabilities.0': { $exists: true },
              },
            },
          ]
        : []),
      { $count: 'totalItems' },
    ];

    logger.debug('Aggregation pipeline:', JSON.stringify(pipeline, null, 2));
    const doctors = await this.model.aggregate(pipeline).exec();
    logger.debug('Doctors result:', doctors);
    const countResult = await this.model.aggregate(countPipeline).exec();
    logger.debug('Count result:', countResult);
    const totalItems = countResult[0]?.totalItems || 0;
    const totalPages = Math.ceil(totalItems / validatedLimit);

    return {
      data: doctors as Doctor[],
      totalPages,
      currentPage: validatedPage,
      totalItems,
    };
  }

  async findAllWithQuery(params: QueryParams): Promise<PaginatedResponse<Doctor>> {
    const {
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isBlocked,
      isVerified,
      speciality,
      experience,
      gender,
      availabilityStart,
      availabilityEnd,
    } = params;

    // Validate parameters
    const validatedPage = parseInt(String(page)) || 1;
    const validatedLimit = parseInt(String(limit)) || 10;
    if (validatedPage < 1) throw new ValidationError('Page must be at least 1');
    if (validatedLimit < 1 || validatedLimit > 100) throw new ValidationError('Limit must be between 1 and 100');
    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
      throw new ValidationError('Sort order must be "asc" or "desc"');
    }

    const query: FilterQuery<Doctor> = {};

    // Handle search
    if (search) {
      query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    }

    // Handle boolean filters
    if (isBlocked !== undefined) {
      query.isBlocked = String(isBlocked) === 'true';
    }
    if (isVerified !== undefined) {
      query.isVerified = String(isVerified) === 'true';
    }

    // Handle speciality
    if (speciality) {
      const specialityIds = await SpecialityModel.find({ name: { $regex: speciality, $options: 'i' } })
        .select('_id')
        .exec();
      query.speciality = { $in: specialityIds.map((s) => s._id) };
    }

    // Handle experience
    if (experience) {
      query.experience = {};
      switch (experience) {
        case '0-5':
          query.experience.$lte = 5;
          break;
        case '6-10':
          query.experience.$gt = 5;
          query.experience.$lte = 10;
          break;
        case '11+':
          query.experience.$gt = 10;
          break;
      }
    }

    // Handle gender
    if (gender) {
      query.gender = gender;
    }

    const pipeline: PipelineStage[] = [{ $match: query }];

    // Handle availability
    if (availabilityStart && availabilityEnd) {
      const startDate = DateUtils.startOfDayUTC(new Date(availabilityStart));
      const endDate = DateUtils.endOfDayUTC(new Date(availabilityEnd));
      pipeline.push({
        $lookup: {
          from: 'availabilities',
          let: { doctorId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$doctorId', '$$doctorId'] },
                    { $gte: ['$date', startDate] },
                    { $lte: ['$date', endDate] },
                    {
                      $gt: [
                        {
                          $size: {
                            $filter: {
                              input: '$timeSlots',
                              as: 'slot',
                              cond: { $eq: ['$$slot.isBooked', false] },
                            },
                          },
                        },
                        0,
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: 'availabilities',
        },
      });
      pipeline.push({
        $match: {
          'availabilities.0': { $exists: true },
        },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'specialities',
          localField: 'speciality',
          foreignField: '_id',
          as: 'specialityObjects',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          qualifications: 1,
          licenseNumber: 1,
          location: 1,
          speciality: {
            $map: {
              input: '$specialityObjects',
              as: 'spec',
              in: '$$spec.name',
            },
          },
          experience: 1,
          allowFreeBooking: 1,
          gender: 1,
          isVerified: 1,
          isBlocked: 1,
          profilePicture: 1,
          profilePicturePublicId: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
      { $skip: (validatedPage - 1) * validatedLimit },
      { $limit: validatedLimit }
    );

    const countPipeline: PipelineStage[] = [
      { $match: query },
      ...(availabilityStart && availabilityEnd
        ? [
            {
              $lookup: {
                from: 'availabilities',
                let: { doctorId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$doctorId', '$$doctorId'] },
                          { $gte: ['$date', DateUtils.startOfDayUTC(new Date(availabilityStart))] },
                          { $lte: ['$date', DateUtils.endOfDayUTC(new Date(availabilityEnd))] },
                          {
                            $gt: [
                              {
                                $size: {
                                  $filter: {
                                    input: '$timeSlots',
                                    as: 'slot',
                                    cond: { $eq: ['$$slot.isBooked', false] },
                                  },
                                },
                              },
                              0,
                            ],
                          },
                        ],
                      },
                    },
                  },
                ],
                as: 'availabilities',
              },
            },
            {
              $match: {
                'availabilities.0': { $exists: true },
              },
            },
          ]
        : []),
      { $count: 'totalItems' },
    ];

    const doctors = await this.model.aggregate(pipeline).exec();
    const countResult = await this.model.aggregate(countPipeline).exec();
    const totalItems = countResult[0]?.totalItems || 0;
    const totalPages = Math.ceil(totalItems / validatedLimit);

    logger.debug('pipeline:', pipeline);
    logger.debug('data:', doctors);

    return {
      data: doctors as Doctor[],
      totalPages,
      currentPage: validatedPage,
      totalItems,
    };
  }

  async findDoctorsWithActiveSubscriptions(): Promise<Doctor[]> {
    const doctorsWithPlans = await SubscriptionPlanModel.distinct('doctorId', { status: 'approved' });
    const doctors = await this.model
      .find({
        _id: { $in: doctorsWithPlans },
        isVerified: true,
        isBlocked: false,
      })
      .exec();
    return doctors.map((doc) => doc.toObject() as Doctor);
  }

  async updateAllowFreeBooking(doctorId: string, allowFreeBooking: boolean): Promise<Doctor | null> {
    if (!mongoose.Types.ObjectId.isValid(doctorId)) return null;
    const doctor = await this.model.findByIdAndUpdate(doctorId, { allowFreeBooking }, { new: true }).exec();
    return doctor ? (doctor.toObject() as Doctor) : null;
  }
}
