import { IBaseRepository } from './IBaseRepository';
import { VideoCallSession } from '../../entities/VideoCallSession';
import { VideoCallSettings } from '../../../types/chatTypes';

export interface IVideoCallRepository extends IBaseRepository<VideoCallSession> {
  findByAppointmentId(appointmentId: string): Promise<VideoCallSession | null>;
  updateSettings(id: string, settings: Partial<VideoCallSettings>): Promise<VideoCallSettings>;
  endSession(id: string): Promise<VideoCallSession | null>;
}
