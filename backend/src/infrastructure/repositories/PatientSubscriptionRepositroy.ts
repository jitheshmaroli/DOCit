import moment from 'moment';
import { IPatientSubscriptionRepository } from '../../core/interfaces/repositories/IPatientSubscriptionRepository';
import { BaseRepository } from './BaseRepository';
import { PatientSubscriptionModel } from '../database/models/PatientSubscriptionModel';
import { PatientSubscription } from '../../core/entities/PatientSubscription';
import { ObjectId } from 'mongodb';

export class PatientSubscriptionRepository
  extends BaseRepository<PatientSubscription>
  implements IPatientSubscriptionRepository
{
  constructor() {
    super(PatientSubscriptionModel);
  }

  async findActiveByPatientAndDoctor(patientId: string, doctorId: string): Promise<PatientSubscription | null> {
    const subscription = await this.model
      .findOne({
        patientId,
        status: 'active',
        endDate: { $gte: new Date() },
        appointmentsLeft: { $gt: 0 },
      })
      .populate({
        path: 'planId',
        match: { doctorId },
      })
      .lean()
      .exec();

    return subscription && subscription.planId ? this.calculateSubscriptionDetails(subscription) : null;
  }

  async findByPatient(patientId: string): Promise<PatientSubscription[]> {
    const subscriptions = await this.model
      .aggregate([
        {
          $match: {
            patientId: new ObjectId(patientId),
          },
        },
        {
          $lookup: {
            from: 'subscriptionplans',
            localField: 'planId',
            foreignField: '_id',
            as: 'planDetails',
          },
        },
        {
          $unwind: {
            path: '$planDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'doctors',
            localField: 'planDetails.doctorId',
            foreignField: '_id',
            as: 'doctorDetails',
          },
        },
        {
          $unwind: {
            path: '$doctorDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            patientId: 1,
            planId: 1,
            planDetails: {
              _id: '$planDetails._id',
              doctorId: '$planDetails.doctorId',
              name: '$planDetails.name',
              description: '$planDetails.description',
              price: '$planDetails.price',
              validityDays: '$planDetails.validityDays',
              appointmentCount: '$planDetails.appointmentCount',
              status: '$planDetails.status',
              createdAt: '$planDetails.createdAt',
              updatedAt: '$planDetails.updatedAt',
            },
            doctorName: '$doctorDetails.name',
            startDate: 1,
            endDate: 1,
            status: 1,
            price: 1,
            appointmentsUsed: 1,
            appointmentsLeft: 1,
            stripePaymentId: 1,
            remainingDays: 1,
            createdAt: 1,
            updatedAt: 1,
            cancellationReason: 1,
            refundId: 1,
            refundAmount: 1,
          },
        },
      ])
      .exec();

    return subscriptions.map((sub) => this.calculateSubscriptionDetails(sub));
  }

  async findAll(): Promise<PatientSubscription[]> {
    const subscriptions = await this.model.find().populate('planId').lean().exec();
    return subscriptions.map((sub) => this.calculateSubscriptionDetails(sub));
  }

  async incrementAppointmentCount(subscriptionId: string): Promise<PatientSubscription | null> {
    const subscription = await this.model
      .findByIdAndUpdate(
        subscriptionId,
        {
          $inc: { appointmentsUsed: 1, appointmentsLeft: -1 },
          $set: { updatedAt: new Date() },
        },
        { new: true }
      )
      .populate('planId')
      .lean()
      .exec();

    if (!subscription) return null;

    // Update status to expired if appointmentsLeft becomes 0
    const updatedSubscription = this.calculateSubscriptionDetails(subscription);
    if (updatedSubscription.appointmentsLeft <= 0 && updatedSubscription.status === 'active') {
      await this.model
        .findByIdAndUpdate(
          subscriptionId,
          {
            status: 'expired',
            updatedAt: new Date(),
          },
          { new: true }
        )
        .exec();
      updatedSubscription.status = 'expired';
    }

    return updatedSubscription;
  }

  async decrementAppointmentCount(subscriptionId: string): Promise<PatientSubscription | null> {
    let subscription = await this.model
      .findByIdAndUpdate(
        subscriptionId,
        {
          $inc: { appointmentsUsed: -1, appointmentsLeft: 1 },
          $set: { updatedAt: new Date() },
        },
        { new: true }
      )
      .populate('planId')
      .lean()
      .exec();
    if (!subscription) return null;

    const updatedSubscription = this.calculateSubscriptionDetails(subscription);

    if (
      updatedSubscription.appointmentsLeft > 0 &&
      moment(updatedSubscription.endDate).isSameOrAfter(moment()) &&
      updatedSubscription.status === 'active' &&
      subscription.status === 'expired'
    ) {
      subscription = await this.model
        .findByIdAndUpdate(
          subscriptionId,
          {
            status: 'active',
            updatedAt: new Date(),
          },
          { new: true }
        )
        .populate('planId')
        .lean()
        .exec();
      if (subscription) {
        return this.calculateSubscriptionDetails(subscription);
      }
    }

    return updatedSubscription;
  }

  async findByPatientAndPlan(patientId: string, planId: string): Promise<PatientSubscription | null> {
    const subscription = await this.model.findOne({ patientId, planId }).populate('planId').lean().exec();
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
      .aggregate([
        {
          $match: {
            status: 'active',
            endDate: { $gte: new Date() },
            appointmentsLeft: { $gt: 0 },
          },
        },
        {
          $lookup: {
            from: 'subscriptionplans',
            localField: 'planId',
            foreignField: '_id',
            as: 'planDetails',
          },
        },
        {
          $unwind: {
            path: '$planDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            patientId: 1,
            planId: 1,
            planDetails: {
              _id: '$planDetails._id',
              doctorId: '$planDetails.doctorId',
              name: '$planDetails.name',
              description: '$planDetails.description',
              price: '$planDetails.price',
              validityDays: '$planDetails.validityDays',
              appointmentCount: '$planDetails.appointmentCount',
              status: '$planDetails.status',
              createdAt: '$planDetails.createdAt',
              updatedAt: '$planDetails.updatedAt',
            },
            startDate: 1,
            endDate: 1,
            status: 1,
            price: 1,
            appointmentsUsed: 1,
            appointmentsLeft: 1,
            stripePaymentId: 1,
            createdAt: 1,
            updatedAt: 1,
            remainingDays: 1,
            cancellationReason: 1,
          },
        },
      ])
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

    if (subscription.appointmentsLeft <= 0 || endDate.isBefore(now)) {
      subscription.status = 'expired';
    }

    subscription.appointmentsLeft = Math.max(0, subscription.appointmentsLeft);
    return subscription;
  }
}
