import { IVideoCallRepository } from '../../interfaces/repositories/IVideoCallRepository';
import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';
import { VideoCallSession } from '../../entities/VideoCallSession';
import { ValidationError, NotFoundError } from '../../../utils/errors';

export class InitiateVideoCallUseCase {
  constructor(
    private videoCallRepository: IVideoCallRepository,
    private appointmentRepository: IAppointmentRepository
  ) {}

  async execute(appointmentId: string, patientId: string, doctorId: string): Promise<VideoCallSession> {
    // Validate input parameters
    if (!appointmentId || !patientId || !doctorId) {
      throw new ValidationError('Appointment ID, patient ID, and doctor ID are required');
    }

    const appointment = await this.appointmentRepository.findById(appointmentId);
    console.log('appid:', appointment, patientId, doctorId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    // Extract IDs from appointment object (handle object structure)
    const appointmentPatientId =
      typeof appointment.patientId === 'object' ? appointment.patientId._id.toString() : appointment.patientId;
    const appointmentDoctorId =
      typeof appointment.doctorId === 'object' ? appointment.doctorId._id.toString() : appointment.doctorId;

    // Validate authorization
    if (appointmentPatientId !== patientId || appointmentDoctorId !== doctorId) {
      throw new ValidationError('Not authorized to initiate this video call');
    }

    if (appointment.status !== 'pending') {
      throw new ValidationError('Cannot initiate video call for non-pending appointment');
    }

    // const now = new Date();
    // const appointmentTime = new Date(appointment.date);
    // const startTime = appointment.startTime.split(':').map(Number);
    // appointmentTime.setHours(startTime[0], startTime[1]);

    // if (now < appointmentTime || now > new Date(appointmentTime.getTime() + 30 * 60 * 1000)) {
    //   throw new ValidationError('Video call can only be initiated during appointment time');
    // }

    // Check for existing video call session
    const existingSession = await this.videoCallRepository.findByAppointmentId(appointmentId);
    if (existingSession) {
      if (existingSession.status === 'active') {
        console.log('Returning existing active session:', existingSession);
        return existingSession;
      }
      throw new ValidationError('A video call session already exists for this appointment');
    }

    const session: VideoCallSession = {
      appointmentId,
      patientId,
      doctorId,
      status: 'active',
      settings: {
        patientAudio: true,
        patientVideo: true,
        doctorAudio: true,
        doctorVideo: true,
      },
    };

    return this.videoCallRepository.create(session);
  }
}
