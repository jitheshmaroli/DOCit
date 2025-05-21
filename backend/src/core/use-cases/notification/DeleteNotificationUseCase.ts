import { INotificationRepository } from '../../interfaces/repositories/INotificationRepository';
import { ValidationError } from '../../../utils/errors';

export class DeleteNotificationUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new ValidationError('Notification not found');
    }
    if (notification.userId !== userId) {
      throw new ValidationError('You can only delete your own notifications');
    }
    await this.notificationRepository.delete(notificationId);
  }
}
