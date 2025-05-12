import { IDoctorRepository } from '../../../core/interfaces/repositories/IDoctorRepository';
import { IPatientSubscriptionRepository } from '../../../core/interfaces/repositories/IPatientSubscriptionRepository';
import { IAppointmentRepository } from '../../../core/interfaces/repositories/IAppointmentRepository';

export class CheckFreeBookingUseCase {
  private doctorRepository: IDoctorRepository;
  private patientSubscriptionRepository: IPatientSubscriptionRepository;
  private appointmentRepository: IAppointmentRepository;

  constructor(
    doctorRepository: IDoctorRepository,
    patientSubscriptionRepository: IPatientSubscriptionRepository,
    appointmentRepository: IAppointmentRepository
  ) {
    this.doctorRepository = doctorRepository;
    this.patientSubscriptionRepository = patientSubscriptionRepository;
    this.appointmentRepository = appointmentRepository;
  }

  async execute(patientId: string, doctorId: string): Promise<boolean> {
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor || !doctor.allowFreeBooking) {
      return false;
    }

    const subscription = await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, doctorId);
    if (subscription) {
      return false;
    }

    const freeAppointmentCount = await this.appointmentRepository.countByPatientAndDoctorWithFreeBooking(
      patientId,
      doctorId
    );
    if (freeAppointmentCount >= 1) {
      return false;
    }

    return true;
  }
}
