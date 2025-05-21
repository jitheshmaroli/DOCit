import mongoose, { Schema } from 'mongoose';
import { VideoCallSession } from '../../../core/entities/VideoCallSession';

const VideoCallSessionSchema = new Schema<VideoCallSession>(
  {
    appointmentId: { type: String, required: true, unique: true },
    patientId: { type: String, required: true },
    doctorId: { type: String, required: true },
    status: { type: String, enum: ['initiated', 'active', 'ended'], required: true },
    settings: {
      patientAudio: { type: Boolean, default: true },
      patientVideo: { type: Boolean, default: true },
      doctorAudio: { type: Boolean, default: true },
      doctorVideo: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const VideoCallSessionModel = mongoose.model<VideoCallSession>('VideoCallSession', VideoCallSessionSchema);
