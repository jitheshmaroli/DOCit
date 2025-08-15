import mongoose from 'mongoose';
import moment from 'moment';
import { IPatientSubscriptionRepository } from '../../core/interfaces/repositories/IPatientSubscriptionRepository';
import { BaseRepository } from './BaseRepository';
import { PatientSubscriptionModel } from '../database/models/PatientSubscriptionModel';
import { PatientSubscription } from '../../core/entities/PatientSubscription';
import logger from '../../utils/logger';

export class PatientSubscriptionRepository
  extends BaseRepository<PatientSubscription>
  implements IPatientSubscriptionRepository
{
  constructor() {
    super(PatientSubscriptionModel);
  }

  // async findActiveByPatientAndDoctor(patientId: string, doctorId: string): Promise<PatientSubscription | null> {
  //   const subscription = await this.model
  //     .findOne({
  //       patientId,
  //       planId: {
  //         $in: await SubscriptionPlanModel.find({ doctorId }).distinct('_id'),
  //       },
  //       status: 'active',
  //       endDate: { $gte: new Date() },
  //     })
  //     .populate('planId')
  //     .lean()
  //     .exec();
  //   return subscription ? this.calculateSubscriptionDetails(subscription) : null;
  // }

  async findActiveByPatientAndDoctor(patientId: string, doctorId: string): Promise<PatientSubscription | null> {
    const subscription = await this.model
      .findOne({
        patientId,
        status: 'active',
      })
      .populate({
        path: 'planId',
        match: { doctorId }, // Ensure the plan belongs to the specified doctor
      })
      .exec();
    return subscription && subscription.planId ? this.calculateSubscriptionDetails(subscription) : null;
  }

  async findByPatient(patientId: string): Promise<PatientSubscription[]> {
    const subscriptions = await this.model.find({ patientId }).populate('planId').lean().exec();
    logger.info('subscriptions:', subscriptions);
    return subscriptions.map((sub) => this.calculateSubscriptionDetails(sub));
  }

  async findAll(): Promise<PatientSubscription[]> {
    const subscriptions = await this.model.find().populate('planId').lean().exec();
    return subscriptions.map((sub) => this.calculateSubscriptionDetails(sub));
  }

  async incrementAppointmentCount(subscriptionId: string): Promise<PatientSubscription | null> {
    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) return null;
    const subscription = await this.model
      .findByIdAndUpdate(subscriptionId, { $inc: { appointmentsUsed: 1, appointmentsLeft: -1 } }, { new: true })
      .populate('planId')
      .lean()
      .exec();
    return subscription ? this.calculateSubscriptionDetails(subscription) : null;
  }

  async decrementAppointmentCount(subscriptionId: string): Promise<PatientSubscription | null> {
    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) return null;
    const subscription = await this.model
      .findByIdAndUpdate(subscriptionId, { $inc: { appointmentsUsed: -1, appointmentsLeft: 1 } }, { new: true })
      .populate('planId')
      .lean()
      .exec();
    return subscription ? this.calculateSubscriptionDetails(subscription) : null;
  }

  async findByStripePaymentId(stripePaymentId: string): Promise<PatientSubscription | null> {
    const subscription = await this.model.findOne({ stripePaymentId }).populate('planId').lean().exec();
    return subscription ? this.calculateSubscriptionDetails(subscription) : null;
  }

  async findExpiringSoon(days: number): Promise<PatientSubscription[]> {
    const date = new Date();
    date.setDate(date.getDate() + days);

    const subscriptions = await this.model
      .find({
        endDate: { $lte: date },
        status: 'active',
      })
      .populate('planId')
      .lean()
      .exec();

    return subscriptions.map((sub) => this.calculateSubscriptionDetails(sub));
  }

  async findActiveSubscriptions(): Promise<PatientSubscription[]> {
    const subscriptions = await this.model
      .find({
        status: 'active',
        endDate: { $gte: new Date() },
      })
      .populate('planId')
      .lean()
      .exec();

    return subscriptions.map((sub) => this.calculateSubscriptionDetails(sub));
  }

  async findByPlan(planId: string): Promise<PatientSubscription[]> {
    const subscriptions = await PatientSubscriptionModel.find({ planId }).lean();
    return subscriptions as PatientSubscription[];
  }

  private calculateSubscriptionDetails(subscription: PatientSubscription): PatientSubscription {
    const endDate = moment(subscription.endDate);
    const now = moment();
    subscription.remainingDays = Math.max(0, endDate.diff(now, 'days'));
    subscription.appointmentsLeft = Math.max(0, subscription.appointmentsLeft);
    return subscription;
  }
}
