import { ChatMessage } from '../../entities/ChatMessage';
import { IChatRepository } from '../../interfaces/repositories/IChatRepository';
import { IPatientSubscriptionRepository } from '../../interfaces/repositories/IPatientSubscriptionRepository';
import { ValidationError } from '../../../utils/errors';
import { UserRole } from '../../../types';

export class SendMessageUseCase {
  constructor(
    private chatRepository: IChatRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository
  ) {}

  async execute(message: ChatMessage): Promise<ChatMessage> {
    let patientId: string;
    let doctorId: string;

    if (message.role === UserRole.Patient) {
      patientId = message.senderId;
      doctorId = message.receiverId;
    } else if (message.role === UserRole.Doctor) {
      patientId = message.receiverId;
      doctorId = message.senderId;
    } else {
      throw new ValidationError('Invalid user role');
    }

    const subscription = await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, doctorId);

    if (!subscription) {
      throw new ValidationError('You must be subscribed to this doctor to send messages');
    }

    const createdMessage = await this.chatRepository.create({
      ...message,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return createdMessage;
  }
}
