import { INotificationRepository } from '../../interfaces/repositories/INotificationRepository';
import { ValidationError } from '../../../utils/errors';

export class MarkNotificationAsReadUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new ValidationError('Notification not found');
    }
    if (notification.userId !== userId) {
      throw new ValidationError('Unauthorized to mark this notification as read');
    }
    await this.notificationRepository.markAsRead(notificationId);
  }
}
