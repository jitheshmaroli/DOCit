import { IVideoCallRepository } from '../../interfaces/repositories/IVideoCallRepository';
import { ValidationError } from '../../../utils/errors';

export class EndVideoCallUseCase {
  constructor(private videoCallRepository: IVideoCallRepository) {}

  async execute(sessionId: string, userId: string): Promise<void> {
    const session = await this.videoCallRepository.findById(sessionId);
    if (!session) {
      throw new ValidationError('Video call session not found');
    }
    if (session.patientId !== userId && session.doctorId !== userId) {
      throw new ValidationError('Unauthorized to end this call');
    }
    await this.videoCallRepository.endSession(sessionId);
  }
}
