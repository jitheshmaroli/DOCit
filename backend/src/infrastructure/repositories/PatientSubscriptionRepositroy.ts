import moment from 'moment';
import { PatientSubscription } from '../../core/entities/PatientSubscription';
import { IPatientSubscriptionRepository } from '../../core/interfaces/repositories/IPatientSubscriptionRepository';
import { PatientSubscriptionModel } from '../database/models/PatientSubscriptionModel';
import { SubscriptionPlanModel } from '../database/models/SubscriptionPlanModel';

export class PatientSubscriptionRepository
  implements IPatientSubscriptionRepository
{
  async create(
    subscription: PatientSubscription
  ): Promise<PatientSubscription> {
    const endDate = moment(subscription.endDate);
    const now = moment();
    subscription.remainingDays = endDate.diff(now, 'days');
    const newSubscription = new PatientSubscriptionModel(subscription);
    return newSubscription.save();
  }

  async findActiveByPatientAndDoctor(
    patientId: string,
    doctorId: string
  ): Promise<PatientSubscription | null> {
    const subscription = await PatientSubscriptionModel.findOne({
      patientId,
      planId: {
        $in: await SubscriptionPlanModel.find({ doctorId }).distinct('_id'),
      },
      status: 'active',
      endDate: { $gte: new Date() },
    })
      .populate('planId')
      .exec();

    if (subscription) {
      const endDate = moment(subscription.endDate);
      const now = moment();
      subscription.remainingDays = Math.max(0, endDate.diff(now, 'days'));
      await subscription.save();
    }

    return subscription;
  }

  async findByPatient(patientId: string): Promise<PatientSubscription[]> {
    const subscriptions = await PatientSubscriptionModel.find({ patientId })
      .populate('planId')
      .exec();

    return subscriptions.map(sub => {
      const endDate = moment(sub.endDate);
      const now = moment();
      sub.remainingDays = Math.max(0, endDate.diff(now, 'days'));
      return sub;
    });
  }
}
