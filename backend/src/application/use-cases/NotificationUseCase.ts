import { INotificationUseCase } from '../../core/interfaces/use-cases/INotificationUseCase';
import { INotificationRepository } from '../../core/interfaces/repositories/INotificationRepository';
import { QueryParams } from '../../types/authTypes';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { SendNotificationRequestDTO, NotificationResponseDTO } from '../dtos/NotificationDTOs';
import { NotificationMapper } from '../mappers/NotificationMapper';

export class NotificationUseCase implements INotificationUseCase {
  constructor(private _notificationRepository: INotificationRepository) {}

  async sendNotification(dto: SendNotificationRequestDTO): Promise<NotificationResponseDTO> {
    if (!dto.userId || !dto.message || !dto.type) {
      throw new ValidationError('User ID, message, and type are required for notification');
    }

    const createdNotification = NotificationMapper.toNotificationEntity(dto);

    try {
      const savedNotification = await this._notificationRepository.create(createdNotification);
      return NotificationMapper.toNotificationResponseDTO(savedNotification);
    } catch {
      throw new Error('Failed to create notification');
    }
  }

  async getNotifications(userId: string, params: QueryParams): Promise<NotificationResponseDTO[]> {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    const notifications = await this._notificationRepository.findByUserId(userId, params);
    return notifications.map((notification) => NotificationMapper.toNotificationResponseDTO(notification));
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    if (!notificationId || !userId) {
      throw new ValidationError('Notification ID and user ID are required');
    }

    const notification = await this._notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ValidationError('You can only delete your own notifications');
    }

    await this._notificationRepository.delete(notificationId);
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    await this._notificationRepository.deleteAllByUserId(userId);
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    if (!notificationId || !userId) {
      throw new ValidationError('Notification ID and user ID are required');
    }

    const notification = await this._notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ValidationError('Unauthorized to mark this notification as read');
    }

    if (notification.isRead) {
      return;
    }

    await this._notificationRepository.markAsRead(notificationId);
  }
}
