import { PatientSubscription } from '../../core/entities/PatientSubscription';
import { IPatientSubscriptionRepository } from '../../core/interfaces/repositories/IPatientSubscriptionRepository';
import { PatientSubscriptionModel } from '../database/models/PatientSubscriptionModel';
import { SubscriptionPlanModel } from '../database/models/SubscriptionPlanModel';
import moment from 'moment';
import mongoose from 'mongoose';

export class PatientSubscriptionRepository implements IPatientSubscriptionRepository {
  async create(subscription: PatientSubscription): Promise<PatientSubscription> {
    const newSubscription = new PatientSubscriptionModel(subscription);
    await newSubscription.save();
    return this.calculateSubscriptionDetails(newSubscription.toObject());
  }

  async findById(id: string): Promise<PatientSubscription | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const subscription = await PatientSubscriptionModel.findById(id).populate('planId').lean();
    if (!subscription) return null;
    return this.calculateSubscriptionDetails(subscription);
  }

  async findByStripePaymentId(stripePaymentId: string): Promise<PatientSubscription | null> {
    const subscription = await PatientSubscriptionModel.findOne({
      stripePaymentId,
    })
      .populate('planId')
      .lean();
    if (!subscription) return null;
    return this.calculateSubscriptionDetails(subscription);
  }

  async findActiveByPatientAndDoctor(patientId: string, doctorId: string): Promise<PatientSubscription | null> {
    const subscription = await PatientSubscriptionModel.findOne({
      patientId,
      planId: {
        $in: await SubscriptionPlanModel.find({ doctorId }).distinct('_id'),
      },
      status: 'active',
      endDate: { $gte: new Date() },
    })
      .populate('planId')
      .lean();

    if (!subscription) return null;
    return this.calculateSubscriptionDetails(subscription);
  }

  async findByPatient(patientId: string): Promise<PatientSubscription[]> {
    const subscriptions = await PatientSubscriptionModel.find({ patientId }).populate('planId').lean();
    return subscriptions.map((sub) => this.calculateSubscriptionDetails(sub));
  }

  async findAll(): Promise<PatientSubscription[]> {
    const subscriptions = await PatientSubscriptionModel.find().populate('planId').lean();
    return subscriptions.map((sub) => this.calculateSubscriptionDetails(sub));
  }

  async incrementAppointmentCount(subscriptionId: string): Promise<PatientSubscription | null> {
    const subscription = await PatientSubscriptionModel.findByIdAndUpdate(
      subscriptionId,
      { $inc: { appointmentsUsed: 1, appointmentsLeft: -1 } },
      { new: true }
    )
      .populate('planId')
      .lean();

    if (!subscription) return null;
    return this.calculateSubscriptionDetails(subscription);
  }

  async decrementAppointmentCount(subscriptionId: string): Promise<PatientSubscription | null> {
    const subscription = await PatientSubscriptionModel.findByIdAndUpdate(
      subscriptionId,
      { $inc: { appointmentsUsed: -1, appointmentsLeft: 1 } },
      { new: true }
    )
      .populate('planId')
      .lean();

    if (!subscription) return null;
    return this.calculateSubscriptionDetails(subscription);
  }

  async update(id: string, updates: Partial<PatientSubscription>): Promise<PatientSubscription | null> {
    const subscription = await PatientSubscriptionModel.findByIdAndUpdate(id, updates, { new: true })
      .populate('planId')
      .lean();
    if (!subscription) return null;
    return this.calculateSubscriptionDetails(subscription);
  }

  async findExpiringSoon(days: number): Promise<PatientSubscription[]> {
    const date = new Date();
    date.setDate(date.getDate() + days);

    const subscriptions = await PatientSubscriptionModel.find({
      endDate: { $lte: date },
      status: 'active',
    })
      .populate('planId')
      .lean();

    return subscriptions.map((sub) => this.calculateSubscriptionDetails(sub));
  }

  async findActiveSubscriptions(): Promise<PatientSubscription[]> {
    const subscriptions = await PatientSubscriptionModel.find({
      status: 'active',
      endDate: { $gte: new Date() },
    })
      .populate('planId')
      .lean();

    return subscriptions.map((sub) => this.calculateSubscriptionDetails(sub));
  }

  private calculateSubscriptionDetails(subscription: PatientSubscription): PatientSubscription {
    const endDate = moment(subscription.endDate);
    const now = moment();
    subscription.remainingDays = Math.max(0, endDate.diff(now, 'days'));

    if (subscription.planId) {
      subscription.appointmentsLeft = Math.max(0, subscription.appointmentsLeft);
    }

    return subscription;
  }
}
