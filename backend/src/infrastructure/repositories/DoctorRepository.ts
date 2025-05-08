import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { Doctor } from '../../core/entities/Doctor';
import { DoctorModel } from '../database/models/DoctorModel';
import { SubscriptionPlanModel } from '../database/models/SubscriptionPlanModel';
import { QueryParams } from '../../types/authTypes';
import { QueryBuilder } from '../../utils/queryBuilder';

export class DoctorRepository implements IDoctorRepository {
  async create(doctor: Doctor): Promise<Doctor> {
    const newDoctor = new DoctorModel(doctor);
    return newDoctor.save();
  }

  async findByEmail(email: string): Promise<Doctor | null> {
    return DoctorModel.findOne({ email, isBlocked: false }).exec();
  }

  async findById(id: string): Promise<Doctor | null> {
    return DoctorModel.findById(id).exec();
  }

  async update(id: string, updates: Partial<Doctor>): Promise<Doctor | null> {
    return DoctorModel.findByIdAndUpdate(id, updates, { new: true }).exec();
  }

  async findByCriteria(criteria: Partial<Doctor>): Promise<Doctor[]> {
    return DoctorModel.find(criteria).exec();
  }

  async findBySpeciality(specialityId: string): Promise<Doctor[]> {
    return DoctorModel.find({ speciality: specialityId }).exec();
  }

  async delete(id: string): Promise<void> {
    await DoctorModel.findByIdAndDelete(id).exec();
  }

  async findAllWithQuery(
    params: QueryParams
  ): Promise<{ data: Doctor[]; totalItems: number }> {
    const query = QueryBuilder.buildQuery(params, 'doctor');
    const sort = QueryBuilder.buildSort(params);
    const { page, limit } = QueryBuilder.validateParams(params);

    const pipeline = [
      {
        $lookup: {
          from: 'specialities',
          localField: 'speciality',
          foreignField: '_id',
          as: 'specialityObjects',
        },
      },
      {
        $match: query,
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
      { $sort: sort },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const countPipeline = [
      {
        $lookup: {
          from: 'specialities',
          localField: 'speciality',
          foreignField: '_id',
          as: 'specialityObjects',
        },
      },
      { $match: query },
      { $count: 'totalItems' },
    ];

    const doctors = await DoctorModel.aggregate(pipeline).exec();
    const countResult = await DoctorModel.aggregate(countPipeline).exec();
    const totalItems = countResult[0]?.totalItems || 0;

    return { data: doctors, totalItems };
  }

  async listVerified(): Promise<Doctor[]> {
    return DoctorModel.find({ isVerified: true, isBlocked: false }).exec();
  }

  async getDoctorDetails(id: string): Promise<Doctor | null> {
    const doctor = await DoctorModel.findById(id).select('-password').exec();
    return doctor ? (doctor.toObject() as Doctor) : null;
  }

  async findVerified(
    params: QueryParams = {}
  ): Promise<{ data: any[]; totalItems: number }> {
    const query = QueryBuilder.buildQuery(params, 'doctor');
    const sort = QueryBuilder.buildSort(params);
    const { page, limit } = QueryBuilder.validateParams(params);

    const pipeline = [
      {
        $match: {
          isVerified: true,
          isBlocked: false,
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
        $match: query,
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
      { $sort: sort },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const countPipeline = [
      { $match: { isVerified: true, isBlocked: false } },
      {
        $lookup: {
          from: 'specialities',
          localField: 'speciality',
          foreignField: '_id',
          as: 'specialityObjects',
        },
      },
      { $match: query },
      { $count: 'totalItems' },
    ];

    const doctors = await DoctorModel.aggregate(pipeline).exec();
    const countResult = await DoctorModel.aggregate(countPipeline).exec();
    const totalItems = countResult[0]?.totalItems || 0;

    return { data: doctors, totalItems };
  }

  async findDoctorsWithActiveSubscriptions(): Promise<Doctor[]> {
    const doctorsWithPlans = await SubscriptionPlanModel.distinct('doctorId', {
      status: 'approved',
    });
    return DoctorModel.find({
      _id: { $in: doctorsWithPlans },
      isVerified: true,
      isBlocked: false,
    }).exec();
  }

  async updateAllowFreeBooking(
    doctorId: string,
    allowFreeBooking: boolean
  ): Promise<Doctor | null> {
    return DoctorModel.findByIdAndUpdate(
      doctorId,
      { allowFreeBooking },
      { new: true }
    ).exec();
  }
}
