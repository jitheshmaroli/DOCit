import { Appointment } from '../../entities/Appointment';
import { IAvailabilityRepository } from '../../interfaces/repositories/IAvailabilityRepository';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';
import { IPatientSubscriptionRepository } from '../../interfaces/repositories/IPatientSubscriptionRepository';
import { CheckFreeBookingUseCase } from '../patient/CheckFreeBookingUseCase';
import { ValidationError, NotFoundError } from '../../../utils/errors';
import { DateUtils } from '../../../utils/DateUtils';
import { MongoServerError } from 'mongodb';

export class BookAppointmentUseCase {
  constructor(
    private appointmentRepository: IAppointmentRepository,
    private availabilityRepository: IAvailabilityRepository,
    private doctorRepository: IDoctorRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository,
    private checkFreeBookingUseCase: CheckFreeBookingUseCase
  ) {}

  async execute(
    patientId: string,
    doctorId: string,
    date: Date,
    startTime: string,
    endTime: string,
    isFreeBooking: boolean = false
  ): Promise<Appointment> {
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) throw new NotFoundError('Doctor not found');

    const startOfDay = DateUtils.startOfDayUTC(date);
    const availability = await this.availabilityRepository.findByDoctorAndDate(doctorId, startOfDay);
    if (!availability) throw new NotFoundError('No availability found for this date');

    const slotAvailable = availability.timeSlots.some(
      (slot) => slot.startTime === startTime && slot.endTime === endTime
    );
    if (!slotAvailable) throw new ValidationError('Selected time slot is not available');

    const existingAppointment = await this.appointmentRepository.findByDoctorAndSlot(
      doctorId,
      startOfDay,
      startTime,
      endTime
    );
    if (existingAppointment) throw new ValidationError('This time slot is already booked');

    if (isFreeBooking) {
      const canBookFree = await this.checkFreeBookingUseCase.execute(patientId, doctorId);
      if (!canBookFree) {
        throw new ValidationError('Not eligible for free booking');
      }
    } else {
      const activeSubscription = await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(
        patientId,
        doctorId
      );
      if (!activeSubscription) {
        throw new ValidationError('A subscription is required for non-free bookings');
      }
      if (activeSubscription.appointmentsLeft <= 0) {
        throw new ValidationError('No appointments left in your subscription');
      }
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

    let savedAppointment: Appointment;
    try {
      savedAppointment = await this.appointmentRepository.create(appointment);
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new ValidationError('This time slot is already booked');
      }
      throw error;
    }

    if (!isFreeBooking) {
      const activeSubscription = await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(
        patientId,
        doctorId
      );
      if (activeSubscription) {
        await this.patientSubscriptionRepository.incrementAppointmentCount(activeSubscription._id!);
      }
    }

    await this.availabilityRepository.updateSlotBookingStatus(doctorId, startOfDay, startTime, true);

    return savedAppointment;
  }
}
