import { IVideoCallRepository } from '../../core/interfaces/repositories/IVideoCallRepository';
import { VideoCallSession } from '../../core/entities/VideoCallSession';
import { VideoCallSessionModel } from '../database/models/VideoCallSessionModel';
import { ValidationError } from '../../utils/errors';
import { VideoCallSettings } from '../../types/chatTypes';

export class VideoCallRepository implements IVideoCallRepository {
  async create(session: VideoCallSession): Promise<VideoCallSession> {
    const newSession = new VideoCallSessionModel(session);
    const savedSession = await newSession.save();
    return savedSession.toObject() as VideoCallSession;
  }

  async findById(id: string): Promise<VideoCallSession | null> {
    const session = await VideoCallSessionModel.findById(id).exec();
    return session ? (session.toObject() as VideoCallSession) : null;
  }

  async findByAppointmentId(appointmentId: string): Promise<VideoCallSession | null> {
    const session = await VideoCallSessionModel.findOne({ appointmentId }).exec();
    return session ? (session.toObject() as VideoCallSession) : null;
  }

  async updateSettings(id: string, settings: Partial<VideoCallSettings>): Promise<VideoCallSettings> {
    const session = await VideoCallSessionModel.findByIdAndUpdate(id, { $set: { settings } }, { new: true }).exec();
    if (!session) {
      throw new ValidationError('Video call session not found');
    }
    return session.toObject().settings as VideoCallSettings;
  }

  async endSession(id: string): Promise<VideoCallSession | null> {
    const session = await VideoCallSessionModel.findByIdAndUpdate(
      id,
      { status: 'ended', updatedAt: new Date() },
      { new: true }
    ).exec();
    return session ? (session.toObject() as VideoCallSession) : null;
  }
}
