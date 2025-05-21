import { VideoCallSession } from '../../entities/VideoCallSession';

export interface IVideoCallService {
  initiateCall(appointmentId: string, patientId: string, doctorId: string): Promise<VideoCallSession>;
  endCall(sessionId: string): Promise<void>;
  updateCallSettings(
    sessionId: string,
    userId: string,
    settings: Partial<VideoCallSession['settings']>
  ): Promise<VideoCallSession>;
}
