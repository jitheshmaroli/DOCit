import { VideoCallSession } from '../../entities/VideoCallSession';
import { VideoCallSettings } from '../../../types/chatTypes';

export interface IVideoCallRepository {
  create(session: VideoCallSession): Promise<VideoCallSession>;
  findById(id: string): Promise<VideoCallSession | null>;
  findByAppointmentId(appointmentId: string): Promise<VideoCallSession | null>;
  updateSettings(id: string, settings: Partial<VideoCallSettings>): Promise<VideoCallSettings>;
  endSession(id: string): Promise<VideoCallSession | null>;
}
