export interface VideoCallSession {
  _id?: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  status: 'initiated' | 'active' | 'ended';
  settings?: {
    patientAudio: boolean;
    patientVideo: boolean;
    doctorAudio: boolean;
    doctorVideo: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
