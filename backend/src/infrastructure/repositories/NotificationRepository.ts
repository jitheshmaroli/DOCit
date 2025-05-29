import mongoose from 'mongoose';
import { INotificationRepository } from '../../core/interfaces/repositories/INotificationRepository';
import { BaseRepository } from './BaseRepository';
import { NotificationModel } from '../database/models/NotificationModel';
import { QueryParams } from '../../types/authTypes';
import { Notification } from '../../core/entities/Notification';

export class NotificationRepository extends BaseRepository<Notification> implements INotificationRepository {
  constructor() {
    super(NotificationModel);
  }

  async findByUserId(userId: string, params: QueryParams): Promise<Notification[]> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const query = { userId };

    const notifications = await this.model
      .find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return notifications.map((notif) => notif.toObject() as Notification);
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.model.deleteMany({ userId }).exec();
  }

  async markAsRead(id: string): Promise<Notification | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const notification = await this.model.findByIdAndUpdate(id, { isRead: true }, { new: true }).exec();
    return notification ? (notification.toObject() as Notification) : null;
  }
}
