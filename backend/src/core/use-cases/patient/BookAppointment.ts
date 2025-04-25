import { Appointment } from '../../entities/Appointment';
import { IAvailabilityRepository } from '../../interfaces/repositories/IAvailabilityRepository';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { ValidationError, NotFoundError } from '../../../utils/errors';
import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';
import { IPatientSubscriptionRepository } from '../../interfaces/repositories/IPatientSubscriptionRepository';
import { DateUtils } from '../../../utils/DateUtils';

export class BookAppointmentUseCase {
  constructor(
    private appointmentRepository: IAppointmentRepository,
    private availabilityRepository: IAvailabilityRepository,
    private doctorRepository: IDoctorRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository
  ) {}

  async execute(
    patientId: string,
    doctorId: string,
    date: Date,
    startTime: string,
    endTime: string
  ): Promise<Appointment> {
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) throw new NotFoundError('Doctor not found');

    const startOfDay = DateUtils.startOfDayUTC(date);
    const availability = await this.availabilityRepository.findByDoctorAndDate(
      doctorId,
      startOfDay
    );
    if (!availability)
      throw new NotFoundError('No availability found for this date');

    const slot = availability.timeSlots.find(
      slot => slot.startTime === startTime && slot.endTime === endTime
    );
    if (!slot)
      throw new ValidationError('Selected time slot is not available');
    if (slot.isBooked)
      throw new ValidationError('Selected time slot is already booked');

    const existingAppointment =
      await this.appointmentRepository.findByDoctorAndSlot(
        doctorId,
        startOfDay,
        startTime,
        endTime
      );
    if (existingAppointment)
      throw new ValidationError('This time slot is already booked');

    const activeSubscription =
      await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(
        patientId,
        doctorId
      );
    let isFreeBooking = false;

    if (!activeSubscription) {
      if (!doctor.allowFreeBooking) {
        throw new ValidationError(
          'This doctor requires a subscription for bookings'
        );
      }

      const priorAppointments =
        await this.appointmentRepository.countByPatientAndDoctor(
          patientId,
          doctorId
        );
      if (priorAppointments >= 1) {
        throw new ValidationError(
          'You must subscribe to book more appointments with this doctor'
        );
      }
      isFreeBooking = true;
    }

    const appointment: Appointment = {
      patientId,
      doctorId,
      date: startOfDay,
      startTime,
      endTime,
      status: 'pending',
      isFreeBooking,
      bookingTime: new Date(),
    };

    const savedAppointment = await this.appointmentRepository.create(appointment);

    await this.availabilityRepository.updateSlotBookingStatus(
      doctorId,
      startOfDay,
      startTime,
      true
    );

    return savedAppointment;
  }
}