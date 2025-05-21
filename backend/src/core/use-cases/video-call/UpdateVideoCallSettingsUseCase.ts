import { IVideoCallRepository } from '../../interfaces/repositories/IVideoCallRepository';
import { VideoCallSettings } from '../../../types/chatTypes';
import { ValidationError, NotFoundError } from '../../../utils/errors';

export class UpdateVideoCallSettingsUseCase {
  constructor(private videoCallRepository: IVideoCallRepository) {}

  async execute(
    sessionId: string,
    userId: string,
    role: 'patient' | 'doctor',
    settings: { audio: boolean; video: boolean }
  ): Promise<VideoCallSettings> {
    const session = await this.videoCallRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Video call session not found');
    }

    if (session.patientId !== userId && session.doctorId !== userId) {
      throw new ValidationError('Not authorized to update this session');
    }

    const currentSettings = session.settings || {
      patientAudio: true,
      patientVideo: true,
      doctorAudio: true,
      doctorVideo: true,
    };

    const updatedSettings: Partial<VideoCallSettings> =
      role === 'patient'
        ? { patientAudio: settings.audio, patientVideo: settings.video }
        : { doctorAudio: settings.audio, doctorVideo: settings.video };

    return this.videoCallRepository.updateSettings(sessionId, {
      ...currentSettings,
      ...updatedSettings,
    });
  }
}
