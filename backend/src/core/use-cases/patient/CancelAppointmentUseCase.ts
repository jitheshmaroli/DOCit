import { DateUtils } from "../../../utils/DateUtils";
import { NotFoundError, ValidationError } from "../../../utils/errors";
import { IAppointmentRepository } from "../../interfaces/repositories/IAppointmentRepository";
import { IAvailabilityRepository } from "../../interfaces/repositories/IAvailabilityRepository";
import { IPatientSubscriptionRepository } from "../../interfaces/repositories/IPatientSubscriptionRepository";

export class CancelAppointmentUseCase {
  constructor(
    private appointmentRepository: IAppointmentRepository,
    private availabilityRepository: IAvailabilityRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository
  ) {}

  async execute(appointmentId: string, patientId: string): Promise<void> {
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }
    if (appointment.patientId !== patientId) {
      throw new ValidationError('You are not authorized to cancel this appointment');
    }
    if (appointment.status === 'cancelled') {
      throw new ValidationError('Appointment is already cancelled');
    }

    await this.appointmentRepository.deleteById(appointmentId);

    const startOfDay = DateUtils.startOfDayUTC(appointment.date);
    await this.availabilityRepository.updateSlotBookingStatus(
      appointment.doctorId,
      startOfDay,
      appointment.startTime,
      false
    );

    if (!appointment.isFreeBooking) {
      const subscription = await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(
        patientId,
        appointment.doctorId
      );
      if (subscription) {
        await this.patientSubscriptionRepository.decrementAppointmentCount(subscription._id!);
      }
    }
  }
}