import { INotificationRepository } from '../../interfaces/repositories/INotificationRepository';
import { ValidationError } from '../../../utils/errors';

export class DeleteAllNotificationsUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(userId: string): Promise<void> {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    await this.notificationRepository.deleteAllByUserId(userId);
  }
}
