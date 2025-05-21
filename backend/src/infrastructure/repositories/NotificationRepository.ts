import { INotificationRepository } from '../../core/interfaces/repositories/INotificationRepository';
import { Notification } from '../../core/entities/Notification';
import { NotificationModel } from '../database/models/NotificationModel';
import { QueryParams } from '../../types/authTypes';
import { QueryBuilder } from '../../utils/queryBuilder';

export class NotificationRepository implements INotificationRepository {
  async create(notification: Notification): Promise<Notification> {
    const newNotification = new NotificationModel(notification);
    const savedNotification = await newNotification.save();
    return savedNotification.toObject() as Notification;
  }

  async findById(id: string): Promise<Notification | null> {
    const notification = await NotificationModel.findById(id).exec();
    return notification ? (notification.toObject() as Notification) : null;
  }

  async findByUserId(userId: string, params: QueryParams): Promise<Notification[]> {
    const query = { userId, ...QueryBuilder.buildQuery(params) };
    const sort = QueryBuilder.buildSort(params);
    const { page, limit } = QueryBuilder.validateParams(params);

    const notifications = await NotificationModel.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return notifications.map((notif) => notif.toObject() as Notification);
  }

  async delete(id: string): Promise<void> {
    await NotificationModel.findByIdAndDelete(id).exec();
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await NotificationModel.deleteMany({ userId });
  }

  async markAsRead(id: string): Promise<Notification | null> {
    const notification = await NotificationModel.findByIdAndUpdate(id, { isRead: true }, { new: true }).exec();
    return notification ? (notification.toObject() as Notification) : null;
  }
}
