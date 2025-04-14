import { PatientSubscription } from "../../core/entities/PatientSubscription";
import { IPatientSubscriptionRepository } from "../../core/interfaces/repositories/IPatientSubscriptionRepository";
import { PatientSubscriptionModel } from "../database/models/PatientSubscriptionModel";
import { SubscriptionPlanModel } from "../database/models/SubscriptionPlanModel";

export class PatientSubscriptionRepository implements IPatientSubscriptionRepository {
  async create(subscription: PatientSubscription): Promise<PatientSubscription> {
    const newSubscription = new PatientSubscriptionModel(subscription);
    return newSubscription.save();
  }

  async findActiveByPatientAndDoctor(patientId: string, doctorId: string): Promise<PatientSubscription | null> {
    return PatientSubscriptionModel.findOne({
      patientId,
      planId: { $in: await SubscriptionPlanModel.find({ doctorId }).distinct('_id') },
      status: 'active',
      endDate: { $gte: new Date() },
    }).exec();
  }

  async findByPatient(patientId: string): Promise<PatientSubscription[]> {
    return PatientSubscriptionModel.find({ patientId }).populate('planId').exec();
  }
}