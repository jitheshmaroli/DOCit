import { Notification } from '../../entities/Notification';
import { INotificationRepository } from '../../interfaces/repositories/INotificationRepository';

export class SendNotificationUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(notification: Notification): Promise<Notification> {
    const createdNotification = await this.notificationRepository.create({
      ...notification,
      isRead: false,
      createdAt: new Date(),
    });
    return createdNotification;
  }
}
