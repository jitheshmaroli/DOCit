import mongoose, { FilterQuery, PipelineStage } from 'mongoose';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { Doctor } from '../../core/entities/Doctor';
import { BaseRepository } from './BaseRepository';
import { DoctorModel } from '../database/models/DoctorModel';
import { SubscriptionPlanModel } from '../database/models/SubscriptionPlanModel';
import { PaginatedResponse, QueryParams } from '../../types/authTypes';
import { ValidationError } from '../../utils/errors';
import logger from '../../utils/logger';
import { SpecialityModel } from '../database/models/SpecialityModel';
import { DateUtils } from '../../utils/DateUtils';

interface ExperienceMatchStage {
  totalExperience: {
    $lte?: number;
    $gt?: number;
  };
}

export class DoctorRepository extends BaseRepository<Doctor> implements IDoctorRepository {
  constructor() {
    super(DoctorModel);
  }

  async findByEmail(email: string): Promise<Doctor | null> {
    const doctor = await this.model.findOne({ email, isBlocked: false }).exec();
    return doctor ? (doctor.toObject() as Doctor) : null;
  }

  async getDoctorDetails(doctorId: string): Promise<Doctor | null> {
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      logger.error(`Invalid doctorId format: ${doctorId}`);
      throw new ValidationError('Invalid doctor ID');
    }
    const pipeline: PipelineStage[] = [
      { $match: { _id: new mongoose.Types.ObjectId(doctorId), isBlocked: false, isVerified: true } },
      {
        $lookup: {
          from: 'reviews',
          let: { doctorId: { $toString: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$doctorId', '$$doctorId'] },
              },
            },
          ],
          as: 'reviews',
        },
      },
      {
        $addFields: {
          averageRating: {
            $ifNull: [{ $avg: '$reviews.rating' }, 0],
          },
          totalExperience: {
            $cond: {
              if: { $and: [{ $isArray: '$experiences' }, { $gt: [{ $size: '$experiences' }, 0] }] },
              then: {
                $sum: {
                  $map: {
                    input: '$experiences',
                    as: 'exp',
                    in: {
                      $cond: {
                        if: { $and: [{ $isNumber: '$$exp.years' }, { $gte: ['$$exp.years', 0] }] },
                        then: '$$exp.years',
                        else: 0,
                      },
                    },
                  },
                },
              },
              else: 0,
            },
          },
        },
      },
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
          experiences: 1,
          totalExperience: 1,
          allowFreeBooking: 1,
          gender: 1,
          isVerified: 1,
          isBlocked: 1,
          profilePicture: 1,
          profilePicturePublicId: 1,
          averageRating: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];
    try {
      logger.debug(`Executing getDoctorDetails pipeline for doctorId: ${doctorId}`, { pipeline });
      const [doctor] = await this.model.aggregate(pipeline).exec();
      logger.debug(`getDoctorDetails result for doctorId: ${doctorId}`, { doctor });
      return doctor ? (doctor as Doctor) : null;
    } catch (error) {
      logger.error(`Error in getDoctorDetails for doctorId: ${doctorId}`, { error });
      throw error;
    }
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
      minRating,
    } = params;

    // Validate parameters
    const validatedPage = parseInt(String(page)) || 1;
    const validatedLimit = parseInt(String(limit)) || 10;
    if (validatedPage < 1) throw new ValidationError('Page must be at least 1');
    if (validatedLimit < 1 || validatedLimit > 100) throw new ValidationError('Limit must be between 1 and 100');
    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
      throw new ValidationError('Sort order must be "asc" or "desc"');
    }
    if (minRating !== undefined && (isNaN(Number(minRating)) || Number(minRating) < 1 || Number(minRating) > 5)) {
      throw new ValidationError('Minimum rating must be between 1 and 5');
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

    const pipeline: PipelineStage[] = [
      { $match: query },
      {
        $addFields: {
          totalExperience: {
            $cond: {
              if: { $isArray: '$experiences' },
              then: { $sum: '$experiences.years' },
              else: 0,
            },
          },
        },
      },
    ];

    // Handle experience
    if (experience) {
      const matchStage: ExperienceMatchStage = { totalExperience: {} };
      switch (experience) {
        case '0-5':
          matchStage.totalExperience.$lte = 5;
          break;
        case '6-10':
          matchStage.totalExperience.$gt = 5;
          matchStage.totalExperience.$lte = 10;
          break;
        case '11+':
          matchStage.totalExperience.$gt = 10;
          break;
      }
      pipeline.push({ $match: matchStage });
    }

    // Handle gender
    if (gender) {
      query.gender = gender;
    }

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
            let: { doctorId: { $toString: '$_id' } },
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
      } catch (error) {
        logger.error('Error parsing availability dates:', error);
        throw new ValidationError('Invalid availability date format');
      }
    }

    // Reviews lookup and averageRating calculation
    pipeline.push(
      {
        $lookup: {
          from: 'reviews',
          let: { doctorId: { $toString: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$doctorId', '$$doctorId'] },
              },
            },
          ],
          as: 'reviews',
        },
      },
      {
        $addFields: {
          averageRating: {
            $ifNull: [{ $avg: '$reviews.rating' }, 0],
          },
        },
      }
    );

    // Handle minRating filter
    if (minRating !== undefined) {
      pipeline.push({
        $match: {
          averageRating: { $gte: Number(minRating) },
        },
      });
    }

    // Project fields
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
          experiences: 1,
          totalExperience: 1,
          allowFreeBooking: 1,
          gender: 1,
          isVerified: 1,
          isBlocked: 1,
          profilePicture: 1,
          profilePicturePublicId: 1,
          averageRating: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $sort: { [sortBy === 'experience' ? 'totalExperience' : sortBy]: sortOrder === 'desc' ? -1 : 1 } },
      { $skip: (validatedPage - 1) * validatedLimit },
      { $limit: validatedLimit }
    );

    const countPipeline: PipelineStage[] = [
      { $match: query },
      {
        $addFields: {
          totalExperience: {
            $cond: {
              if: { $isArray: '$experiences' },
              then: { $sum: '$experiences.years' },
              else: 0,
            },
          },
        },
      },
      ...(experience
        ? [
            {
              $match: (() => {
                const match: ExperienceMatchStage = { totalExperience: {} };
                switch (experience) {
                  case '0-5':
                    match.totalExperience.$lte = 5;
                    break;
                  case '6-10':
                    match.totalExperience.$gt = 5;
                    match.totalExperience.$lte = 10;
                    break;
                  case '11+':
                    match.totalExperience.$gt = 10;
                    break;
                }
                return match;
              })(),
            },
          ]
        : []),
      ...(availabilityStart && availabilityEnd
        ? [
            {
              $lookup: {
                from: 'availabilities',
                let: { doctorId: { $toString: '$_id' } },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$doctorId', '$$doctorId'] },
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
      {
        $lookup: {
          from: 'reviews',
          let: { doctorId: { $toString: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$doctorId', '$$doctorId'] },
              },
            },
          ],
          as: 'reviews',
        },
      },
      {
        $addFields: {
          averageRating: {
            $ifNull: [{ $avg: '$reviews.rating' }, 0],
          },
        },
      },
      ...(minRating !== undefined
        ? [
            {
              $match: {
                averageRating: { $gte: Number(minRating) },
              },
            },
          ]
        : []),
      { $count: 'totalItems' },
    ];

    try {
      const doctors = await this.model.aggregate(pipeline).exec();
      const countResult = await this.model.aggregate(countPipeline).exec();
      const totalItems = countResult[0]?.totalItems || 0;
      const totalPages = Math.ceil(totalItems / validatedLimit);

      return {
        data: doctors as Doctor[],
        totalPages,
        currentPage: validatedPage,
        totalItems,
      };
    } catch (error) {
      logger.error('Error in findVerified:', error);
      throw error;
    }
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
      minRating,
    } = params;

    // Validate parameters
    const validatedPage = parseInt(String(page)) || 1;
    const validatedLimit = parseInt(String(limit)) || 10;
    if (validatedPage < 1) throw new ValidationError('Page must be at least 1');
    if (validatedLimit < 1 || validatedLimit > 100) throw new ValidationError('Limit must be between 1 and 100');
    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
      throw new ValidationError('Sort order must be "asc" or "desc"');
    }
    if (minRating !== undefined && (isNaN(Number(minRating)) || Number(minRating) < 1 || Number(minRating) > 5)) {
      throw new ValidationError('Minimum rating must be between 1 and 5');
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

    const pipeline: PipelineStage[] = [
      { $match: query },
      {
        $addFields: {
          totalExperience: {
            $cond: {
              if: { $isArray: '$experiences' },
              then: { $sum: '$experiences.years' },
              else: 0,
            },
          },
        },
      },
    ];

    // Handle experience
    if (experience) {
      const matchStage: ExperienceMatchStage = { totalExperience: {} };
      switch (experience) {
        case '0-5':
          matchStage.totalExperience.$lte = 5;
          break;
        case '6-10':
          matchStage.totalExperience.$gt = 5;
          matchStage.totalExperience.$lte = 10;
          break;
        case '11+':
          matchStage.totalExperience.$gt = 10;
          break;
      }
      pipeline.push({ $match: matchStage });
    }

    // Handle gender
    if (gender) {
      query.gender = gender;
    }

    // Handle availability
    if (availabilityStart && availabilityEnd) {
      try {
        const startDate = DateUtils.startOfDayUTC(DateUtils.parseToUTC(availabilityStart));
        const endDate = DateUtils.endOfDayUTC(DateUtils.parseToUTC(availabilityEnd));
        pipeline.push({
          $lookup: {
            from: 'availabilities',
            let: { doctorId: { $toString: '$_id' } },
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
      } catch (error) {
        logger.error('Error parsing availability dates:', error);
        throw new ValidationError('Invalid availability date format');
      }
    }

    // Reviews lookup and averageRating calculation
    pipeline.push(
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'doctorId',
          as: 'reviews',
        },
      },
      {
        $addFields: {
          averageRating: { $ifNull: [{ $avg: '$reviews.rating' }, 0] },
        },
      }
    );

    // Handle minRating filter
    if (minRating !== undefined) {
      pipeline.push({
        $match: {
          averageRating: { $gte: Number(minRating) },
        },
      });
    }

    // Project fields
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
          experiences: 1,
          totalExperience: 1,
          allowFreeBooking: 1,
          gender: 1,
          isVerified: 1,
          isBlocked: 1,
          profilePicture: 1,
          profilePicturePublicId: 1,
          averageRating: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $sort: { [sortBy === 'experience' ? 'totalExperience' : sortBy]: sortOrder === 'desc' ? -1 : 1 } },
      { $skip: (validatedPage - 1) * validatedLimit },
      { $limit: validatedLimit }
    );

    const countPipeline: PipelineStage[] = [
      { $match: query },
      {
        $addFields: {
          totalExperience: {
            $cond: {
              if: { $isArray: '$experiences' },
              then: { $sum: '$experiences.years' },
              else: 0,
            },
          },
        },
      },
      ...(experience
        ? [
            {
              $match: (() => {
                const match: ExperienceMatchStage = { totalExperience: {} };
                switch (experience) {
                  case '0-5':
                    match.totalExperience.$lte = 5;
                    break;
                  case '6-10':
                    match.totalExperience.$gt = 5;
                    match.totalExperience.$lte = 10;
                    break;
                  case '11+':
                    match.totalExperience.$gt = 10;
                    break;
                }
                return match;
              })(),
            },
          ]
        : []),
      ...(availabilityStart && availabilityEnd
        ? [
            {
              $lookup: {
                from: 'availabilities',
                let: { doctorId: { $toString: '$_id' } },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$doctorId', '$$doctorId'] },
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
      {
        $lookup: {
          from: 'reviews',
          let: { doctorId: { $toString: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$doctorId', '$$doctorId'] },
              },
            },
          ],
          as: 'reviews',
        },
      },
      {
        $addFields: {
          averageRating: {
            $ifNull: [{ $avg: '$reviews.rating' }, 0],
          },
        },
      },
      ...(minRating !== undefined
        ? [
            {
              $match: {
                averageRating: { $gte: Number(minRating) },
              },
            },
          ]
        : []),
      { $count: 'totalItems' },
    ];

    try {
      const doctors = await this.model.aggregate(pipeline).exec();
      const countResult = await this.model.aggregate(countPipeline).exec();
      const totalItems = countResult[0]?.totalItems || 0;
      const totalPages = Math.ceil(totalItems / validatedLimit);

      return {
        data: doctors as Doctor[],
        totalPages,
        currentPage: validatedPage,
        totalItems,
      };
    } catch (error) {
      logger.error('Error in findAllWithQuery:', error);
      throw error;
    }
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
