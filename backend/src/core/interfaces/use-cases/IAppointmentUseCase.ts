import { QueryParams } from '../../../types/authTypes';
import {
  AppointmentDTO,
  BookAppointmentRequestDTO,
  BookAppointmentResponseDTO,
  CancelAppointmentRequestDTO,
  CheckFreeBookingRequestDTO,
  CompleteAppointmentRequestDTO,
  CompleteAppointmentResponseDTO,
  GetAppointmentsResponseDTO,
  GetDoctorAndPatientAppointmentsRequestDTO,
  GetPatientAppointmentsForDoctorRequestDTO,
  GetPatientAppointmentsResponseDTO,
} from '../../../application/dtos/AppointmentDTOs';

export interface IAppointmentUseCase {
  bookAppointment(dto: BookAppointmentRequestDTO): Promise<BookAppointmentResponseDTO>;
  cancelAppointment(dto: CancelAppointmentRequestDTO): Promise<void>;
  adminCancelAppointment(appointmentId: string): Promise<void>;
  completeAppointment(dto: CompleteAppointmentRequestDTO): Promise<CompleteAppointmentResponseDTO>;
  getAllAppointments(params: QueryParams): Promise<GetAppointmentsResponseDTO>;
  getDoctorAppointments(doctorId: string, params: QueryParams): Promise<GetAppointmentsResponseDTO>;
  getDoctorAndPatientAppointmentsWithQuery(
    dto: GetDoctorAndPatientAppointmentsRequestDTO
  ): Promise<GetAppointmentsResponseDTO>;
  getPatientAppointments(patientId: string, queryParams: QueryParams): Promise<GetPatientAppointmentsResponseDTO>;
  getAppointmentsBySubscription(
    subscriptionId: string,
    queryParams: QueryParams
  ): Promise<GetPatientAppointmentsResponseDTO>;
  getSingleAppointment(appointmentId: string): Promise<AppointmentDTO>;
  getPatientAppointmentsForDoctor(
    dto: GetPatientAppointmentsForDoctorRequestDTO
  ): Promise<GetPatientAppointmentsResponseDTO>;
  getAppointmentById(appointmentId: string): Promise<AppointmentDTO>;
  checkFreeBooking(dto: CheckFreeBookingRequestDTO): Promise<boolean>;
}
