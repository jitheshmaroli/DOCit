import { IVideoCallService } from '../../core/interfaces/services/IVideoCallService';
import { VideoCallSession } from '../../core/entities/VideoCallSession';
import { IVideoCallRepository } from '../../core/interfaces/repositories/IVideoCallRepository';
import { ValidationError } from '../../utils/errors';
import { VideoCallSettings } from '../../types/chatTypes';

export class VideoCallService implements IVideoCallService {
  constructor(private videoCallRepository: IVideoCallRepository) {}

  async initiateCall(appointmentId: string, patientId: string, doctorId: string): Promise<VideoCallSession> {
    return this.videoCallRepository.create({
      appointmentId,
      patientId,
      doctorId,
      status: 'initiated',
      settings: {
        patientAudio: true,
        patientVideo: true,
        doctorAudio: true,
        doctorVideo: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async endCall(sessionId: string): Promise<void> {
    await this.videoCallRepository.endSession(sessionId);
  }

  async updateCallSettings(
    sessionId: string,
    userId: string,
    settings: Partial<VideoCallSettings>
  ): Promise<VideoCallSession> {
    await this.videoCallRepository.updateSettings(sessionId, settings);
    const session = await this.videoCallRepository.findById(sessionId);
    if (!session) {
      throw new ValidationError('Video call session not found');
    }
    return session;
  }
}
