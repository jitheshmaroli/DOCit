import { ISubscriptionPlanRepository } from '../../core/interfaces/repositories/ISubscriptionPlanRepository';
import { BaseRepository } from './BaseRepository';
import { SubscriptionPlanModel } from '../database/models/SubscriptionPlanModel';
import { DoctorModel } from '../database/models/DoctorModel';
import { QueryParams } from '../../types/authTypes';
import { SubscriptionPlan } from '../../core/entities/SubscriptionPlan';
import { FilterQuery } from 'mongoose';

export class SubscriptionPlanRepository
  extends BaseRepository<SubscriptionPlan>
  implements ISubscriptionPlanRepository
{
  constructor() {
    super(SubscriptionPlanModel);
  }

  async findAllWithQuery(params: QueryParams): Promise<{ data: SubscriptionPlan[]; totalItems: number }> {
    const { search = '', page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const query: FilterQuery<SubscriptionPlan> = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const plans = await this.model
      .find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();

    const totalItems = await this.model.countDocuments(query).exec();

    const populatedPlans = await Promise.all(plans.map((plan) => this.populateDoctorName(plan)));

    return { data: populatedPlans, totalItems };
  }

  async findByDoctor(doctorId: string): Promise<SubscriptionPlan[]> {
    const plans = await this.model.find({ doctorId }).lean().exec();
    return Promise.all(plans.map((plan) => this.populateDoctorName(plan)));
  }

  async findApprovedByDoctor(doctorId: string): Promise<SubscriptionPlan[]> {
    const plans = await this.model.find({ doctorId, status: 'approved' }).lean().exec();
    return Promise.all(plans.map((plan) => this.populateDoctorName(plan)));
  }

  async findPending(): Promise<SubscriptionPlan[]> {
    const plans = await this.model.find({ status: 'pending' }).lean().exec();
    return Promise.all(plans.map((plan) => this.populateDoctorName(plan)));
  }

  private async populateDoctorName(plan: SubscriptionPlan): Promise<SubscriptionPlan> {
    if (plan.doctorId) {
      const doctor = await DoctorModel.findById(plan.doctorId).select('name').lean().exec();
      plan.doctorName = doctor?.name || 'N/A';
    } else {
      plan.doctorName = 'N/A';
    }
    return plan;
  }
}
