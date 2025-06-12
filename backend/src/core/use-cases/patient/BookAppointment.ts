import { Appointment } from '../../entities/Appointment';
import { IAvailabilityRepository } from '../../interfaces/repositories/IAvailabilityRepository';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { IAppointmentRepository } from '../../interfaces/repositories/IAppointmentRepository';
import { IPatientSubscriptionRepository } from '../../interfaces/repositories/IPatientSubscriptionRepository';
import { CheckFreeBookingUseCase } from '../patient/CheckFreeBookingUseCase';
import { ValidationError, NotFoundError } from '../../../utils/errors';
import { DateUtils } from '../../../utils/DateUtils';
import { MongoServerError } from 'mongodb';
import { Notification, NotificationType } from '../../entities/Notification';
import { INotificationService } from '../../interfaces/services/INotificationService';
import { IPatientRepository } from '../../interfaces/repositories/IPatientRepository';
import { IEmailService } from '../../interfaces/services/IEmailService';
import logger from '../../../utils/logger';

export class BookAppointmentUseCase {
  constructor(
    private appointmentRepository: IAppointmentRepository,
    private availabilityRepository: IAvailabilityRepository,
    private doctorRepository: IDoctorRepository,
    private patientRepository: IPatientRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository,
    private checkFreeBookingUseCase: CheckFreeBookingUseCase,
    private notificationService: INotificationService,
    private emailService: IEmailService
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

    const patient = await this.patientRepository.findById(patientId);
    if (!patient) throw new NotFoundError('Patient not found');

    const startOfDay = DateUtils.startOfDayUTC(date);
    const availability = await this.availabilityRepository.findByDoctorAndDate(doctorId, startOfDay);
    if (!availability) throw new NotFoundError('No availability found for this date');

    const slotAvailable = availability.timeSlots.find(
      (slot) => slot.startTime === startTime && slot.endTime === endTime
    );
    logger.debug('slot available:', slotAvailable);
    if (!slotAvailable) throw new ValidationError('Selected time slot is not available');

    if (slotAvailable.isBooked) throw new ValidationError('This time slot is already booked');

    const existingAppointment = await this.appointmentRepository.findByDoctorAndSlot(
      doctorId,
      startOfDay,
      startTime,
      endTime
    );
    if (existingAppointment && existingAppointment.status !== 'cancelled') {
      throw new ValidationError('This time slot is already booked with a non-cancelled appointment');
    }

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
      logger.info('trying to create appointment');
      savedAppointment = await this.appointmentRepository.create(appointment);
      logger.debug('savedAppointment:', savedAppointment);
    } catch (error) {
      logger.debug('error from db:', error);
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

    // Notifications for patient and doctor
    const patientNotification: Notification = {
      userId: patientId,
      type: NotificationType.APPOINTMENT_BOOKED,
      message: `Your appointment with Dr. ${doctor.name} has been booked for ${appointment.startTime} on ${appointment.date.toLocaleDateString()}.`,
      isRead: false,
      createdAt: new Date(),
    };

    const doctorNotification: Notification = {
      userId: doctorId,
      type: NotificationType.APPOINTMENT_BOOKED,
      message: `A new appointment with ${patient.name} has been booked for ${appointment.startTime} on ${appointment.date.toLocaleDateString()}.`,
      isRead: false,
      createdAt: new Date(),
    };

    // Email notifications
    const patientEmailSubject = 'Appointment Confirmation';
    const patientEmailText = `Dear ${patient.name},\n\nYour appointment with Dr. ${doctor.name} has been successfully booked for ${appointment.startTime} on ${appointment.date.toLocaleDateString()}. Please ensure you arrive on time.\n\nBest regards,\nDOCit Team`;
    const doctorEmailSubject = 'New Appointment Scheduled';
    const doctorEmailText = `Dear Dr. ${doctor.name},\n\nA new appointment with ${patient.name} has been scheduled for ${appointment.startTime} on ${appointment.date.toLocaleDateString()}.\n\nBest regards,\nDOCit Team`;

    // Send notifications and emails
    await Promise.all([
      this.notificationService.sendNotification(patientNotification),
      this.notificationService.sendNotification(doctorNotification),
      this.emailService.sendEmail(patient.email, patientEmailSubject, patientEmailText),
      this.emailService.sendEmail(doctor.email, doctorEmailSubject, doctorEmailText),
    ]);

    return savedAppointment;
  }
}
