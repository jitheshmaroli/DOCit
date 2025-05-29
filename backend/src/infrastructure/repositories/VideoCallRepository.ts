import mongoose from 'mongoose';
import { IVideoCallRepository } from '../../core/interfaces/repositories/IVideoCallRepository';
import { BaseRepository } from './BaseRepository';
import { VideoCallSessionModel } from '../database/models/VideoCallSessionModel';
import { VideoCallSettings } from '../../types/chatTypes';
import { ValidationError } from '../../utils/errors';
import { VideoCallSession } from '../../core/entities/VideoCallSession';

export class VideoCallRepository extends BaseRepository<VideoCallSession> implements IVideoCallRepository {
  constructor() {
    super(VideoCallSessionModel);
  }

  async findByAppointmentId(appointmentId: string): Promise<VideoCallSession | null> {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) return null;
    const session = await this.model.findOne({ appointmentId }).exec();
    return session ? (session.toObject() as VideoCallSession) : null;
  }

  async updateSettings(id: string, settings: Partial<VideoCallSettings>): Promise<VideoCallSettings> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid video call session ID');
    }
    const session = await this.model.findByIdAndUpdate(id, { $set: { settings } }, { new: true }).exec();
    if (!session) {
      throw new ValidationError('Video call session not found');
    }
    return session.toObject().settings as VideoCallSettings;
  }

  async endSession(id: string): Promise<VideoCallSession | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const session = await this.model
      .findByIdAndUpdate(id, { status: 'ended', updatedAt: new Date() }, { new: true })
      .exec();
    return session ? (session.toObject() as VideoCallSession) : null;
  }
}
