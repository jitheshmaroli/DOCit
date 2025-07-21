import { IAppointmentUseCase } from '../interfaces/use-cases/IAppointmentUseCase';
import { Appointment } from '../entities/Appointment';
import { Prescription } from '../entities/Prescription';
import { QueryParams } from '../../types/authTypes';
import { IAppointmentRepository } from '../interfaces/repositories/IAppointmentRepository';
import { IAvailabilityRepository } from '../interfaces/repositories/IAvailabilityRepository';
import { IPatientSubscriptionRepository } from '../interfaces/repositories/IPatientSubscriptionRepository';
import { INotificationService } from '../interfaces/services/INotificationService';
import { IEmailService } from '../interfaces/services/IEmailService';
import { IDoctorRepository } from '../interfaces/repositories/IDoctorRepository';
import { IPatientRepository } from '../interfaces/repositories/IPatientRepository';
import { Notification, NotificationType } from '../entities/Notification';
import { DateUtils } from '../../utils/DateUtils';
import { NotFoundError, ValidationError } from '../../utils/errors';
import logger from '../../utils/logger';
import { MongoServerError } from 'mongodb';

export class AppointmentUseCase implements IAppointmentUseCase {
  constructor(
    private appointmentRepository: IAppointmentRepository,
    private availabilityRepository: IAvailabilityRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository,
    private notificationService: INotificationService,
    private emailService: IEmailService,
    private doctorRepository: IDoctorRepository,
    private patientRepository: IPatientRepository
  ) {}

  async bookAppointment(
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
      const canBookFree = await this.checkFreeBooking(patientId, doctorId);
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

    const patientEmailSubject = 'Appointment Confirmation';
    const patientEmailText = `Dear ${patient.name},\n\nYour appointment with Dr. ${doctor.name} has been successfully booked for ${appointment.startTime} on ${appointment.date.toLocaleDateString()}. Please ensure you arrive on time.\n\nBest regards,\nDOCit Team`;
    const doctorEmailSubject = 'New Appointment Scheduled';
    const doctorEmailText = `Dear Dr. ${doctor.name},\n\nA new appointment with ${patient.name} has been scheduled for ${appointment.startTime} on ${appointment.date.toLocaleDateString()}.\n\nBest regards,\nDOCit Team`;

    await Promise.all([
      this.notificationService.sendNotification(patientNotification),
      this.notificationService.sendNotification(doctorNotification),
      this.emailService.sendEmail(patient.email, patientEmailSubject, patientEmailText),
      this.emailService.sendEmail(doctor.email, doctorEmailSubject, doctorEmailText),
    ]);

    return savedAppointment;
  }

  async cancelAppointment(appointmentId: string, patientId: string, cancellationReason?: string): Promise<void> {
    if (!patientId) {
      logger.error('No patientId provided for appointment cancellation');
      throw new ValidationError('Patient ID is required');
    }

    const appointment: Appointment | null = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      logger.error(`Appointment not found: ${appointmentId}`);
      throw new NotFoundError('Appointment not found');
    }

    const appointmentPatientId =
      typeof appointment.patientId === 'object' && appointment.patientId !== null
        ? appointment.patientId._id?.toString()
        : appointment.patientId?.toString();

    if (appointmentPatientId !== patientId) {
      logger.error(
        `Authorization failed: Provided patientId ${patientId} does not match appointment patientId ${appointmentPatientId}`
      );
      throw new ValidationError('You are not authorized to cancel this appointment');
    }

    if (appointment.status === 'cancelled') {
      logger.warn(`Appointment already cancelled: ${appointmentId}`);
      throw new ValidationError('Appointment is already cancelled');
    }

    const doctorId =
      typeof appointment.doctorId === 'object' && appointment.doctorId !== null
        ? appointment.doctorId._id?.toString()
        : appointment.doctorId?.toString();

    if (!doctorId) {
      logger.error(`Invalid doctorId for appointment ${appointmentId}`);
      throw new ValidationError('Invalid doctor ID');
    }

    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) throw new NotFoundError('Doctor not found');

    const patient = await this.patientRepository.findById(patientId);
    if (!patient) throw new NotFoundError('Patient not found');

    await this.appointmentRepository.update(appointmentId, {
      status: 'cancelled',
      cancellationReason,
    });

    const startOfDay = DateUtils.startOfDayUTC(appointment.date);
    try {
      await this.availabilityRepository.updateSlotBookingStatus(doctorId, startOfDay, appointment.startTime, false);
    } catch (error) {
      logger.error(`Failed to update availability slot for doctor ${doctorId}: ${(error as Error).message}`);
      throw new Error(`Failed to update availability: ${(error as Error).message}`);
    }

    if (!appointment.isFreeBooking) {
      const subscription = await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, doctorId);
      if (subscription) {
        await this.patientSubscriptionRepository.decrementAppointmentCount(subscription._id!);
      }
    }

    const patientNotification: Notification = {
      userId: patientId,
      type: NotificationType.APPOINTMENT_CANCELLED,
      message: `Your appointment with Dr. ${doctor.name} for ${appointment.startTime} on ${appointment.date.toLocaleDateString()} has been cancelled.${cancellationReason ? ` Reason: ${cancellationReason}` : ''}`,
      isRead: false,
      createdAt: new Date(),
    };

    const doctorNotification: Notification = {
      userId: doctorId,
      type: NotificationType.APPOINTMENT_CANCELLED,
      message: `An appointment with ${patient.name} for ${appointment.startTime} on ${appointment.date.toLocaleDateString()} has been cancelled.${cancellationReason ? ` Reason: ${cancellationReason}` : ''}`,
      isRead: false,
      createdAt: new Date(),
    };

    const patientEmailSubject = 'Appointment Cancellation';
    const patientEmailText = `Dear ${patient.name},\n\nYour appointment with Dr. ${doctor.name} for ${appointment.startTime} on ${appointment.date.toLocaleDateString()} has been cancelled.${cancellationReason ? ` Reason: ${cancellationReason}` : ''}\n\nBest regards,\nDOCit Team`;
    const doctorEmailSubject = 'Appointment Cancellation';
    const doctorEmailText = `Dear Dr. ${doctor.name},\n\nAn appointment with ${patient.name} for ${appointment.startTime} on ${appointment.date.toLocaleDateString()} has been cancelled.${cancellationReason ? ` Reason: ${cancellationReason}` : ''}\n\nBest regards,\nDOCit Team`;

    await Promise.all([
      this.notificationService.sendNotification(patientNotification),
      this.notificationService.sendNotification(doctorNotification),
      this.emailService.sendEmail(patient.email, patientEmailSubject, patientEmailText),
      this.emailService.sendEmail(doctor.email, doctorEmailSubject, doctorEmailText),
    ]);
  }

  async adminCancelAppointment(appointmentId: string): Promise<void> {
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      logger.error(`Appointment not found: ${appointmentId}`);
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.status === 'cancelled') {
      logger.warn(`Appointment already cancelled: ${appointmentId}`);
      throw new Error('Appointment is already cancelled');
    }

    const patientId =
      typeof appointment.patientId === 'object' && appointment.patientId !== null
        ? appointment.patientId._id?.toString()
        : appointment.patientId?.toString();

    const doctorId =
      typeof appointment.doctorId === 'object' && appointment.doctorId !== null
        ? appointment.doctorId._id?.toString()
        : appointment.doctorId?.toString();

    if (!doctorId) {
      throw new ValidationError('Invalid doctor ID');
    }

    await this.appointmentRepository.update(appointmentId, { status: 'cancelled' });

    const startOfDay = DateUtils.startOfDayUTC(appointment.date);
    try {
      await this.availabilityRepository.updateSlotBookingStatus(doctorId, startOfDay, appointment.startTime, false);
    } catch (error) {
      logger.error(`Failed to update availability slot for doctor ${doctorId}: ${(error as Error).message}`);
      throw new Error(`Failed to update availability: ${(error as Error).message}`);
    }

    if (!appointment.isFreeBooking && patientId) {
      const subscription = await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, doctorId);
      if (subscription) {
        await this.patientSubscriptionRepository.decrementAppointmentCount(subscription._id!);
      }
    }

    const doctorName =
      typeof appointment.doctorId === 'object' && appointment.doctorId !== null ? appointment.doctorId.name : null;
    const patientName =
      typeof appointment.patientId === 'object' && appointment.patientId !== null ? appointment.patientId.name : null;

    const patientNotification: Notification = {
      userId: patientId,
      type: NotificationType.APPOINTMENT_CANCELLED,
      message: `Your appointment with Dr. ${doctorName} for ${appointment.startTime} on ${appointment.date.toLocaleDateString()} has been cancelled.`,
      isRead: false,
      createdAt: new Date(),
    };

    const doctorNotification: Notification = {
      userId: doctorId,
      type: NotificationType.APPOINTMENT_CANCELLED,
      message: `An appointment with ${patientName} for ${appointment.startTime} on ${appointment.date.toLocaleDateString()} has been cancelled.`,
      isRead: false,
      createdAt: new Date(),
    };

    await Promise.all([
      this.notificationService.sendNotification(patientNotification),
      this.notificationService.sendNotification(doctorNotification),
    ]);
  }

  async completeAppointment(
    doctorId: string,
    appointmentId: string,
    prescription: Omit<Prescription, '_id' | 'appointmentId' | 'patientId' | 'doctorId' | 'createdAt' | 'updatedAt'>
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      logger.error(`Appointment not found: ${appointmentId}`);
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.status !== 'pending') {
      logger.error(`Only pending appointments can be marked as completed: ${appointmentId}`);
      throw new ValidationError('Only pending appointments can be marked as completed');
    }

    const appointmentDoctorId =
      typeof appointment.doctorId === 'object' && appointment.doctorId !== null
        ? appointment.doctorId._id?.toString()
        : appointment.doctorId?.toString();

    if (appointmentDoctorId !== doctorId) {
      logger.error(
        `Authorization failed: Provided doctorId ${doctorId} does not match appointment doctorId ${appointmentDoctorId}`
      );
      throw new ValidationError('You are not authorized to complete this appointment');
    }

    const patientId =
      typeof appointment.patientId === 'object' && appointment.patientId !== null
        ? appointment.patientId._id?.toString()
        : appointment.patientId?.toString();

    if (!patientId) {
      logger.error(`Invalid patientId for appointment ${appointmentId}`);
      throw new ValidationError('Invalid patient ID');
    }

    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) {
      logger.error(`Doctor not found: ${doctorId}`);
      throw new NotFoundError('Doctor not found');
    }

    const patient = await this.patientRepository.findById(patientId);
    if (!patient) {
      logger.error(`Patient not found: ${patientId}`);
      throw new NotFoundError('Patient not found');
    }

    const updatedAppointment = await this.appointmentRepository.completeAppointmentAndCreatePrescription(
      appointmentId,
      prescription
    );

    // Send notifications for prescription
    const patientNotification: Notification = {
      userId: patientId,
      type: NotificationType.PRESCRIPTION_ISSUED,
      message: `A new prescription has been issued by Dr. ${doctor.name} for your appointment on ${appointment.date.toLocaleDateString()} at ${appointment.startTime}.`,
      isRead: false,
      createdAt: new Date(),
    };

    const doctorNotification: Notification = {
      userId: doctorId,
      type: NotificationType.PRESCRIPTION_ISSUED,
      message: `You have issued a new prescription for ${patient.name} for the appointment on ${appointment.date.toLocaleDateString()} at ${appointment.startTime}.`,
      isRead: false,
      createdAt: new Date(),
    };

    const patientEmailSubject = 'New Prescription Issued';
    const patientEmailText = `Dear ${patient.name},\n\nDr. ${doctor.name} has issued a new prescription for your appointment on ${appointment.date.toLocaleDateString()} at ${appointment.startTime}. Please check your account for details.\n\nBest regards,\nDOCit Team`;
    const doctorEmailSubject = 'Prescription Issued Confirmation';
    const doctorEmailText = `Dear Dr. ${doctor.name},\n\nYou have successfully issued a prescription for ${patient.name} for the appointment on ${appointment.date.toLocaleDateString()} at ${appointment.startTime}.\n\nBest regards,\nDOCit Team`;

    try {
      await Promise.all([
        this.notificationService.sendNotification(patientNotification),
        this.notificationService.sendNotification(doctorNotification),
        this.emailService.sendEmail(patient.email, patientEmailSubject, patientEmailText),
        this.emailService.sendEmail(doctor.email, doctorEmailSubject, doctorEmailText),
      ]);
      logger.info(`Notifications and emails sent for prescription of appointment ${appointmentId}`);
    } catch (error) {
      logger.error(
        `Failed to send notifications or emails for prescription of appointment ${appointmentId}: ${(error as Error).message}`
      );
    }

    return updatedAppointment;
  }

  async getAllAppointments(params: QueryParams): Promise<{ data: Appointment[]; totalItems: number }> {
    return this.appointmentRepository.findAllWithQuery(params);
  }

  async getDoctorAppointments(
    doctorId: string,
    params: QueryParams
  ): Promise<{ data: Appointment[]; totalItems: number }> {
    return this.appointmentRepository.findByDoctorWithQuery(doctorId, params);
  }

  async getDoctorAndPatientAppointmentsWithQuery(
    doctorId: string,
    patientId: string,
    params: QueryParams
  ): Promise<{ data: Appointment[]; totalItems: number }> {
    return this.appointmentRepository.findByPatientAndDoctorWithQuery(patientId, doctorId, params);
  }

  async getPatientAppointments(
    patientId: string,
    queryParams: QueryParams
  ): Promise<{ appointments: Appointment[]; totalItems: number }> {
    const result = await this.appointmentRepository.findAllWithQuery({ ...queryParams, patientId });
    return {
      appointments: result.data,
      totalItems: result.totalItems,
    };
  }

  async getPatientAppointmentsForDoctor(
    patientId: string,
    doctorId: string,
    queryParams: QueryParams
  ): Promise<{ appointments: Appointment[]; totalItems: number }> {
    const result = await this.appointmentRepository.findByPatientAndDoctorWithQuery(patientId, doctorId, queryParams);
    return {
      appointments: result.data,
      totalItems: result.totalItems,
    };
  }

  async getSingleAppointment(doctorId: string, appointmentId: string): Promise<Appointment> {
    if (!appointmentId) {
      throw new ValidationError('Appointment ID is required');
    }

    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    return appointment;
  }

  async getAppointmentById(appointmentId: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new ValidationError('No appointment found');
    }
    return appointment;
  }

  async checkFreeBooking(patientId: string, doctorId: string): Promise<boolean> {
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
