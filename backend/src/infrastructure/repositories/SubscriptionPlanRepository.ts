import { SubscriptionPlan } from '../../core/entities/SubscriptionPlan';
import { ISubscriptionPlanRepository } from '../../core/interfaces/repositories/ISubscriptionPlanRepository';
import { QueryParams } from '../../types/authTypes';
import { NotFoundError } from '../../utils/errors';
import { QueryBuilder } from '../../utils/queryBuilder';
import { DoctorModel } from '../database/models/DoctorModel';
import { SubscriptionPlanModel } from '../database/models/SubscriptionPlanModel';

export class SubscriptionPlanRepository implements ISubscriptionPlanRepository {
  async create(plan: SubscriptionPlan): Promise<SubscriptionPlan> {
    const newPlan = await SubscriptionPlanModel.create(plan);
    return this.populateDoctorName(newPlan.toObject());
  }

  async findById(id: string): Promise<SubscriptionPlan | null> {
    const plan = await SubscriptionPlanModel.findById(id).lean();
    if (!plan) return null;
    return this.populateDoctorName(plan);
  }

  async findAllWithQuery(
    params: QueryParams
  ): Promise<{ data: SubscriptionPlan[]; totalItems: number }> {
    const query = QueryBuilder.buildQuery(params);
    const sort = QueryBuilder.buildSort(params);
    const { page, limit } = QueryBuilder.validateParams(params);

    const plans = await SubscriptionPlanModel.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();

    const totalItems = await SubscriptionPlanModel.countDocuments(query).exec();

    const populatedPlans = await Promise.all(
      plans.map(plan => this.populateDoctorName(plan))
    );

    return { data: populatedPlans, totalItems };
  }

  async findByDoctor(doctorId: string): Promise<SubscriptionPlan[]> {
    const plans = await SubscriptionPlanModel.find({ doctorId }).lean();
    return Promise.all(plans.map(plan => this.populateDoctorName(plan)));
  }

  async findApprovedByDoctor(doctorId: string): Promise<SubscriptionPlan[]> {
    const plans = await SubscriptionPlanModel.find({
      doctorId,
      status: 'approved',
    }).lean();
    return Promise.all(plans.map(plan => this.populateDoctorName(plan)));
  }

  async findPending(): Promise<SubscriptionPlan[]> {
    const plans = await SubscriptionPlanModel.find({
      status: 'pending',
    }).lean();
    return Promise.all(plans.map(plan => this.populateDoctorName(plan)));
  }

  async update(
    id: string,
    updates: Partial<SubscriptionPlan>
  ): Promise<SubscriptionPlan | null> {
    const plan = await SubscriptionPlanModel.findByIdAndUpdate(id, updates, {
      new: true,
    }).lean();
    if (!plan) return null;
    return this.populateDoctorName(plan);
  }

  async delete(id: string): Promise<void> {
    const result = await SubscriptionPlanModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundError('Plan not found');
    }
  }

  private async populateDoctorName(plan: any): Promise<SubscriptionPlan> {
    if (plan.doctorId) {
      const doctor = await DoctorModel.findById(plan.doctorId)
        .select('name')
        .lean();
      plan.doctorName = doctor?.name || 'N/A';
    } else {
      plan.doctorName = 'N/A';
    }
    return plan as SubscriptionPlan;
  }
}
