import { SubscriptionPlan } from "../../core/entities/SubscriptionPlan";
import { ISubscriptionPlanRepository } from "../../core/interfaces/repositories/ISubscriptionPlanRepository";
import { SubscriptionPlanModel } from "../database/models/SubscriptionPlanModel";

export class SubscriptionPlanRepository implements ISubscriptionPlanRepository {
  async create(plan: SubscriptionPlan): Promise<SubscriptionPlan> {
    const newPlan = new SubscriptionPlanModel(plan);
    return newPlan.save();
  }

  async findById(id: string): Promise<SubscriptionPlan | null> {
    return SubscriptionPlanModel.findById(id).exec();
  }

  async findApprovedByDoctor(doctorId: string): Promise<SubscriptionPlan[]> {
    return SubscriptionPlanModel.find({ doctorId, status: 'approved' }).exec();
  }

  async findByDoctor(doctorId: string): Promise<SubscriptionPlan[]> {
    return SubscriptionPlanModel.find({ doctorId }).exec();
  }

  async findPending(): Promise<SubscriptionPlan[]> {
    return SubscriptionPlanModel.find({ status: 'pending' }).exec();
  }

  async update(id: string, updates: Partial<SubscriptionPlan>): Promise<void> {
    await SubscriptionPlanModel.findByIdAndUpdate(id, updates).exec();
  }
}
