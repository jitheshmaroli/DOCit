import { IAppointmentUseCase } from '../../core/interfaces/use-cases/IAppointmentUseCase';
import { QueryParams } from '../../types/authTypes';
import { IAppointmentRepository } from '../../core/interfaces/repositories/IAppointmentRepository';
import { IAvailabilityRepository } from '../../core/interfaces/repositories/IAvailabilityRepository';
import { IPatientSubscriptionRepository } from '../../core/interfaces/repositories/IPatientSubscriptionRepository';
import { INotificationService } from '../../core/interfaces/services/INotificationService';
import { IEmailService } from '../../core/interfaces/services/IEmailService';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { IPatientRepository } from '../../core/interfaces/repositories/IPatientRepository';
import { Notification, NotificationType } from '../../core/entities/Notification';
import { DateUtils } from '../../utils/DateUtils';
import { NotFoundError, ValidationError } from '../../utils/errors';
import logger from '../../utils/logger';
import {
  BookAppointmentRequestDTO,
  BookAppointmentResponseDTO,
  CancelAppointmentRequestDTO,
  CompleteAppointmentRequestDTO,
  CompleteAppointmentResponseDTO,
  GetAppointmentsResponseDTO,
  GetDoctorAndPatientAppointmentsRequestDTO,
  GetPatientAppointmentsResponseDTO,
  GetPatientAppointmentsForDoctorRequestDTO,
  CheckFreeBookingRequestDTO,
  AppointmentDTO,
  AppointmentStatus,
} from '../dtos/AppointmentDTOs';
import { AppointmentMapper } from '../mappers/AppointmentMapper';
import { IImageUploadService } from '../../core/interfaces/services/IImageUploadService';
import PDFKit from 'pdfkit';
import { IPrescriptionRepository } from '../../core/interfaces/repositories/IPrescriptionRepository';

export class AppointmentUseCase implements IAppointmentUseCase {
  constructor(
    private _appointmentRepository: IAppointmentRepository,
    private _availabilityRepository: IAvailabilityRepository,
    private _patientSubscriptionRepository: IPatientSubscriptionRepository,
    private _notificationService: INotificationService,
    private _emailService: IEmailService,
    private _doctorRepository: IDoctorRepository,
    private _patientRepository: IPatientRepository,
    private _imageUploadService: IImageUploadService,
    private _prescriptionRepository: IPrescriptionRepository
  ) {}

  async bookAppointment(dto: BookAppointmentRequestDTO): Promise<BookAppointmentResponseDTO> {
    const doctor = await this._doctorRepository.findById(dto.doctorId);
    if (!doctor) throw new NotFoundError('Doctor not found');

    const patient = await this._patientRepository.findById(dto.patientId);
    if (!patient) throw new NotFoundError('Patient not found');

    const startOfDay = DateUtils.startOfDayUTC(new Date(dto.date));
    const availability = await this._availabilityRepository.findByDoctorAndDate(dto.doctorId, startOfDay);
    if (!availability) throw new NotFoundError('No availability found for this date');

    const slotAvailable = availability.timeSlots.find(
      (slot) => slot.startTime === dto.startTime && slot.endTime === dto.endTime
    );
    if (!slotAvailable) throw new ValidationError('Selected time slot is not available');

    if (slotAvailable.isBooked) throw new ValidationError('This time slot is already booked');

    const existingAppointment = await this._appointmentRepository.findByDoctorAndSlot(
      dto.doctorId,
      startOfDay,
      dto.startTime,
      dto.endTime
    );
    if (existingAppointment && existingAppointment.status !== 'cancelled') {
      throw new ValidationError('This time slot is already booked with a non-cancelled appointment');
    }

    let activeSubscription;
    if (dto.isFreeBooking) {
      const canBookFree = await this.checkFreeBooking({ patientId: dto.patientId, doctorId: dto.doctorId });
      if (!canBookFree) {
        throw new ValidationError('Not eligible for free booking');
      }
    } else {
      activeSubscription = await this._patientSubscriptionRepository.findActiveByPatientAndDoctor(
        dto.patientId,
        dto.doctorId
      );
      if (!activeSubscription) {
        throw new ValidationError('A subscription is required for non-free bookings');
      }
      if (activeSubscription.appointmentsLeft <= 0) {
        throw new ValidationError('No appointments left in your subscription');
      }
    }

    const appointmentDTO = {
      ...dto,
      date: startOfDay.toISOString(),
      startTime: dto.startTime,
      endTime: dto.endTime,
      status: AppointmentStatus.PENDING,
      isFreeBooking: dto.isFreeBooking,
      bookingTime: new Date().toISOString(),
      planId: dto.isFreeBooking ? undefined : activeSubscription?.planId,
    };

    const appointment = AppointmentMapper.toAppointmentEntity(appointmentDTO);

    const savedAppointment = await this._appointmentRepository.create(appointment);

    if (!dto.isFreeBooking && activeSubscription) {
      await this._patientSubscriptionRepository.incrementAppointmentCount(activeSubscription._id!);
    }

    await this._availabilityRepository.updateSlotBookingStatus(dto.doctorId, startOfDay, dto.startTime, true);

    const savedAppointmentDTO = AppointmentMapper.toAppointmentDTO(savedAppointment);

    const patientNotification: Notification = {
      userId: dto.patientId,
      type: NotificationType.APPOINTMENT_BOOKED,
      message: `Your appointment with Dr. ${doctor.name} has been booked for ${dto.startTime} on ${startOfDay.toLocaleDateString()}.`,
      isRead: false,
      createdAt: new Date(),
    };

    const doctorNotification: Notification = {
      userId: dto.doctorId,
      type: NotificationType.APPOINTMENT_BOOKED,
      message: `A new appointment with ${patient.name} has been booked for ${dto.startTime} on ${startOfDay.toLocaleDateString()}.`,
      isRead: false,
      createdAt: new Date(),
    };

    const patientEmailSubject = 'Appointment Confirmation';
    const patientEmailText = `Dear ${patient.name},\n\nYour appointment with Dr. ${doctor.name} has been successfully booked for ${dto.startTime} on ${startOfDay.toLocaleDateString()}. Please ensure you arrive on time.\n\nBest regards,\nDOCit Team`;
    const doctorEmailSubject = 'New Appointment Scheduled';
    const doctorEmailText = `Dear Dr. ${doctor.name},\n\nA new appointment with ${patient.name} has been scheduled for ${dto.startTime} on ${startOfDay.toLocaleDateString()}.\n\nBest regards,\nDOCit Team`;

    await Promise.all([
      this._notificationService.sendNotification(patientNotification),
      this._notificationService.sendNotification(doctorNotification),
      this._emailService.sendEmail(patient.email, patientEmailSubject, patientEmailText),
      this._emailService.sendEmail(doctor.email, doctorEmailSubject, doctorEmailText),
    ]);

    return {
      appointment: savedAppointmentDTO,
      message: 'Appointment booked successfully',
    };
  }

  async cancelAppointment(dto: CancelAppointmentRequestDTO): Promise<void> {
    if (!dto.patientId) {
      throw new ValidationError('Patient ID is required');
    }

    const appointment = await this._appointmentRepository.findById(dto.appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.status === 'cancelled') {
      throw new ValidationError('Appointment is already cancelled');
    }

    if (appointment.patientId.toString() !== dto.patientId.toString()) {
      throw new ValidationError('Unauthorized to cancel this appointment');
    }

    const doctor = await this._doctorRepository.findById(appointment.doctorId);
    if (!doctor) throw new NotFoundError('Doctor not found');

    const patient = await this._patientRepository.findById(appointment.patientId);
    if (!patient) throw new NotFoundError('Patient not found');

    await this._appointmentRepository.update(dto.appointmentId, {
      status: AppointmentStatus.CANCELLED,
      cancellationReason: dto.cancellationReason,
    });

    const startOfDay = DateUtils.startOfDayUTC(appointment.date);

    await this._availabilityRepository.updateSlotBookingStatus(
      appointment.doctorId,
      startOfDay,
      appointment.startTime,
      false
    );

    if (!appointment.isFreeBooking && appointment.planId) {
      const subscription = await this._patientSubscriptionRepository.findActiveByPatientAndDoctor(
        appointment.patientId,
        appointment.doctorId
      );
      if (subscription && subscription.planId === appointment.planId) {
        await this._patientSubscriptionRepository.decrementAppointmentCount(subscription._id!);
      }
    }

    const patientNotification: Notification = {
      userId: appointment.patientId,
      type: NotificationType.APPOINTMENT_CANCELLED,
      message: `Your appointment with Dr. ${doctor.name} for ${appointment.startTime} on ${appointment.date.toLocaleDateString()} has been cancelled.${dto.cancellationReason ? ` Reason: ${dto.cancellationReason}` : ''}`,
      isRead: false,
      createdAt: new Date(),
    };

    const doctorNotification: Notification = {
      userId: appointment.doctorId,
      type: NotificationType.APPOINTMENT_CANCELLED,
      message: `An appointment with ${patient.name} for ${appointment.startTime} on ${appointment.date.toLocaleDateString()} has been cancelled.${dto.cancellationReason ? ` Reason: ${dto.cancellationReason}` : ''}`,
      isRead: false,
      createdAt: new Date(),
    };

    const patientEmailSubject = 'Appointment Cancellation';
    const patientEmailText = `Dear ${patient.name},\n\nYour appointment with Dr. ${doctor.name} for ${appointment.startTime} on ${appointment.date.toLocaleDateString()} has been cancelled.${dto.cancellationReason ? ` Reason: ${dto.cancellationReason}` : ''}\n\nBest regards,\nDOCit Team`;
    const doctorEmailSubject = 'Appointment Cancellation';
    const doctorEmailText = `Dear Dr. ${doctor.name},\n\nAn appointment with ${patient.name} for ${appointment.startTime} on ${appointment.date.toLocaleDateString()} has been cancelled.${dto.cancellationReason ? ` Reason: ${dto.cancellationReason}` : ''}\n\nBest regards,\nDOCit Team`;

    await Promise.all([
      this._notificationService.sendNotification(patientNotification),
      this._notificationService.sendNotification(doctorNotification),
      this._emailService.sendEmail(patient.email, patientEmailSubject, patientEmailText),
      this._emailService.sendEmail(doctor.email, doctorEmailSubject, doctorEmailText),
    ]);
  }

  async adminCancelAppointment(appointmentId: string): Promise<void> {
    const appointment = await this._appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new ValidationError('Appointment is already cancelled');
    }

    const doctor = await this._doctorRepository.findById(appointment.doctorId);
    if (!doctor) throw new NotFoundError('Doctor not found');

    const patient = await this._patientRepository.findById(appointment.patientId);
    if (!patient) throw new NotFoundError('Patient not found');

    await this._appointmentRepository.update(appointmentId, { status: 'cancelled' });

    const startOfDay = DateUtils.startOfDayUTC(appointment.date);
    try {
      await this._availabilityRepository.updateSlotBookingStatus(
        appointment.doctorId,
        startOfDay,
        appointment.startTime,
        false
      );
    } catch (error) {
      throw new Error(`Failed to update availability: ${(error as Error).message}`);
    }

    if (!appointment.isFreeBooking && appointment.planId) {
      const subscription = await this._patientSubscriptionRepository.findActiveByPatientAndDoctor(
        appointment.patientId,
        appointment.doctorId
      );
      if (subscription && subscription.planId === appointment.planId) {
        await this._patientSubscriptionRepository.decrementAppointmentCount(subscription._id!);
      }
    }

    const patientNotification: Notification = {
      userId: appointment.patientId,
      type: NotificationType.APPOINTMENT_CANCELLED,
      message: `Your appointment with Dr. ${doctor.name} for ${appointment.startTime} on ${appointment.date.toLocaleDateString()} has been cancelled by an admin.`,
      isRead: false,
      createdAt: new Date(),
    };

    const doctorNotification: Notification = {
      userId: appointment.doctorId,
      type: NotificationType.APPOINTMENT_CANCELLED,
      message: `An appointment with ${patient.name} for ${appointment.startTime} on ${appointment.date.toLocaleDateString()} has been cancelled by an admin.`,
      isRead: false,
      createdAt: new Date(),
    };

    const patientEmailSubject = 'Appointment Cancellation';
    const patientEmailText = `Dear ${patient.name},\n\nYour appointment with Dr. ${doctor.name} for ${appointment.startTime} on ${appointment.date.toLocaleDateString()} has been cancelled by an admin.\n\nBest regards,\nDOCit Team`;
    const doctorEmailSubject = 'Appointment Cancellation';
    const doctorEmailText = `Dear Dr. ${doctor.name},\n\nAn appointment with ${patient.name} for ${appointment.startTime} on ${appointment.date.toLocaleDateString()} has been cancelled by an admin.\n\nBest regards,\nDOCit Team`;

    await Promise.all([
      this._notificationService.sendNotification(patientNotification),
      this._notificationService.sendNotification(doctorNotification),
      this._emailService.sendEmail(patient.email, patientEmailSubject, patientEmailText),
      this._emailService.sendEmail(doctor.email, doctorEmailSubject, doctorEmailText),
    ]);
  }

  async completeAppointment(dto: CompleteAppointmentRequestDTO): Promise<CompleteAppointmentResponseDTO> {
    const appointment = await this._appointmentRepository.findById(dto.appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new ValidationError('Only pending appointments can be marked as completed');
    }

    if (appointment.doctorId.toString() !== dto.doctorId.toString()) {
      throw new ValidationError('Unauthorized to complete this appointment');
    }

    const doctor = await this._doctorRepository.findById(appointment.doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    const patient = await this._patientRepository.findById(appointment.patientId);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    const prescription = await this._prescriptionRepository.createPrescription(
      dto.appointmentId,
      appointment.patientId,
      appointment.doctorId,
      AppointmentMapper.toPrescriptionEntity(dto.prescription)
    );

    const pdfBuffer = await this.generatePrescriptionPDF({
      patientName: patient.name || 'Unknown',
      doctorName: doctor.name || 'Unknown',
      doctorQualification: doctor.qualifications?.join(', ') || '',
      date: appointment.date.toLocaleDateString(),
      age: patient.age?.toString() || 'N/A',
      gender: patient.gender || 'N/A',
      contact: patient.phone || 'N/A',
      address: patient.address || 'N/A',
      medications: dto.prescription.medications,
      notes: dto.prescription.notes,
    });

    const { url: pdfUrl } = await this._imageUploadService.uploadPDF(pdfBuffer, 'prescriptions');

    if (prescription._id) {
      await this._prescriptionRepository.update(prescription._id, { pdfUrl });
    } else {
      throw new Error('Failed to create prescription: No ID returned');
    }

    const updatedAppointment = await this._appointmentRepository.completeAppointment(
      dto.appointmentId,
      prescription._id
    );

    const updatedAppointmentDTO = AppointmentMapper.toAppointmentDTO(updatedAppointment);

    const patientNotification: Notification = {
      userId: appointment.patientId,
      type: NotificationType.PRESCRIPTION_ISSUED,
      message: `A new prescription has been issued by Dr. ${doctor.name} for your appointment on ${appointment.date.toLocaleDateString()} at ${appointment.startTime}.`,
      isRead: false,
      createdAt: new Date(),
    };

    const doctorNotification: Notification = {
      userId: appointment.doctorId,
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
        this._notificationService.sendNotification(patientNotification),
        this._notificationService.sendNotification(doctorNotification),
        this._emailService.sendEmail(patient.email, patientEmailSubject, patientEmailText),
        this._emailService.sendEmail(doctor.email, doctorEmailSubject, doctorEmailText),
      ]);
    } catch (error) {
      logger.error(
        `Failed to send notifications or emails for prescription of appointment ${dto.appointmentId}: ${(error as Error).message}`
      );
    }

    return {
      appointment: updatedAppointmentDTO,
      message: 'Appointment completed successfully',
    };
  }

  async getAllAppointments(params: QueryParams): Promise<GetAppointmentsResponseDTO> {
    const result = await this._appointmentRepository.findAllWithQuery(params);
    return {
      data: result.data.map((appointment) => AppointmentMapper.toAppointmentDTO(appointment)),
      totalItems: result.totalItems,
    };
  }

  async getDoctorAppointments(doctorId: string, params: QueryParams): Promise<GetAppointmentsResponseDTO> {
    const result = await this._appointmentRepository.findByDoctorWithQuery(doctorId, params);
    return {
      data: result.data.map((appointment) => AppointmentMapper.toAppointmentDTO(appointment)),
      totalItems: result.totalItems,
    };
  }

  async getDoctorAndPatientAppointmentsWithQuery(
    dto: GetDoctorAndPatientAppointmentsRequestDTO
  ): Promise<GetAppointmentsResponseDTO> {
    const result = await this._appointmentRepository.findByPatientAndDoctorWithQuery(
      dto.patientId,
      dto.doctorId,
      dto.queryParams
    );
    return {
      data: result.data.map((appointment) => AppointmentMapper.toAppointmentDTO(appointment)),
      totalItems: result.totalItems,
    };
  }

  async getPatientAppointments(
    patientId: string,
    queryParams: QueryParams
  ): Promise<GetPatientAppointmentsResponseDTO> {
    const result = await this._appointmentRepository.findAllWithQuery({ ...queryParams, patientId });
    return {
      appointments: result.data.map((appointment) => AppointmentMapper.toAppointmentDTO(appointment)),
      totalItems: result.totalItems,
    };
  }

  async getPatientAppointmentsForDoctor(
    dto: GetPatientAppointmentsForDoctorRequestDTO
  ): Promise<GetPatientAppointmentsResponseDTO> {
    const result = await this._appointmentRepository.findByPatientAndDoctorWithQuery(
      dto.patientId,
      dto.doctorId,
      dto.queryParams
    );
    return {
      appointments: result.data.map((appointment) => AppointmentMapper.toAppointmentDTO(appointment)),
      totalItems: result.totalItems,
    };
  }

  async getSingleAppointment(appointmentId: string): Promise<AppointmentDTO> {
    if (!appointmentId) {
      throw new ValidationError('Appointment ID is required');
    }

    const appointment = await this._appointmentRepository.findByIdPopulated(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    return AppointmentMapper.toAppointmentDTO(appointment);
  }

  async getAppointmentById(appointmentId: string): Promise<AppointmentDTO> {
    const appointment = await this._appointmentRepository.findByIdPopulated(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }
    return AppointmentMapper.toAppointmentDTO(appointment);
  }

  async checkFreeBooking(dto: CheckFreeBookingRequestDTO): Promise<boolean> {
    const doctor = await this._doctorRepository.findById(dto.doctorId);
    if (!doctor || !doctor.allowFreeBooking) {
      return false;
    }

    const subscription = await this._patientSubscriptionRepository.findActiveByPatientAndDoctor(
      dto.patientId,
      dto.doctorId
    );
    if (subscription) {
      return false;
    }

    const freeAppointmentCount = await this._appointmentRepository.countByPatientAndDoctorWithFreeBooking(
      dto.patientId,
      dto.doctorId
    );
    if (freeAppointmentCount >= 1) {
      return false;
    }

    return true;
  }

  private async generatePrescriptionPDF(data: {
    patientName: string;
    doctorName: string;
    doctorQualification: string;
    date: string;
    diagnosis?: string;
    age?: string;
    weight?: string;
    bp?: string;
    gender?: string;
    contact?: string;
    address?: string;
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
    notes?: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFKit({ size: 'A4', margin: 0 });
      const buffers: Buffer[] = [];

      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Colors from app design
      const primaryColor = '#0F828C';

      // Fonts
      doc.registerFont('Arial', 'Helvetica');

      // Header (simulating gradient with solid color)
      doc.rect(0, 0, 595, 150).fill(primaryColor);
      doc.font('Arial').fontSize(36).fillColor('#FFFFFF').text('DOCit', 50, 40);
      doc.fontSize(24).text('+', 150, 45);
      doc.fontSize(16).fillColor('#FFFFFF').text(`Dr. ${data.doctorName}`, 50, 90);
      doc.text(data.doctorQualification || 'MD', 50, 110);

      // Patient Information Table
      doc.fillColor('#000000').fontSize(12);
      let y = 170;
      const tableWidth = 495;
      const labelWidth = 100;
      const valueWidth = 150;
      const cellPadding = 5;

      // Draw table background
      doc.rect(50, y, tableWidth, 100).fill('#F5F5F5');

      // Row 1: Name and Age
      doc
        .fillColor('#333333')
        .font('Arial')
        .fontSize(12)
        .text('Name:', 50 + cellPadding, y + cellPadding, { width: labelWidth });
      doc.text(data.patientName || 'Unknown Patient', 50 + labelWidth + cellPadding, y + cellPadding, {
        width: valueWidth,
      });
      doc.text('Age:', 50 + labelWidth + valueWidth + cellPadding, y + cellPadding, { width: labelWidth });
      doc.text(data.age || 'N/A', 50 + 2 * labelWidth + valueWidth + cellPadding, y + cellPadding, {
        width: valueWidth,
      });
      y += 25;

      // Row 3: Gender and Contact
      doc.text('Gender:', 50 + cellPadding, y + cellPadding, { width: labelWidth });
      doc.text(data.gender || 'N/A', 50 + labelWidth + cellPadding, y + cellPadding, { width: valueWidth });
      doc.text('Contact:', 50 + labelWidth + valueWidth + cellPadding, y + cellPadding, { width: labelWidth });
      doc.text(data.contact || 'N/A', 50 + 2 * labelWidth + valueWidth + cellPadding, y + cellPadding, {
        width: valueWidth,
      });
      y += 25;

      // Row 4: Address
      doc.text('Address:', 50 + cellPadding, y + cellPadding, { width: labelWidth });
      doc.text(data.address || 'N/A', 50 + labelWidth + cellPadding, y + cellPadding, {
        width: tableWidth - labelWidth - 2 * cellPadding,
      });
      y += 40;

      // Prescription Area
      doc.fillColor('#000000').fontSize(14).text('Prescription', 50, y, { underline: true });
      y += 30;

      // Medications
      doc.text('Medications:', 50, y, { width: labelWidth });
      y += 20;
      data.medications.forEach((med, index) => {
        const medText = `${index + 1}. ${med.name} - ${med.dosage}, ${med.frequency}, ${med.duration}`;
        doc.text(medText, 50 + cellPadding, y, { width: tableWidth - 2 * cellPadding });
        y += 20;
      });

      // Notes (Instructions)
      if (data.notes) {
        doc.text('Instructions:', 50, y, { width: labelWidth });
        doc.text(data.notes, 50 + labelWidth + cellPadding, y, { width: tableWidth - labelWidth - 2 * cellPadding });
        y += 40;
      }

      // Footer
      const footerY = 842 - 60; // A4 height - footer height
      doc.rect(0, footerY, 595, 60).fill(primaryColor);
      doc.fillColor('#FFFFFF').fontSize(12);
      doc.text('DOCit Clinic', 50, footerY + 10);
      doc.text('docit.site', 50, footerY + 30);
      doc.end();
    });
  }
}
