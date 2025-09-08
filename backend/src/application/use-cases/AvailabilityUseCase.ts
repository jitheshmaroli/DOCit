import { IAvailabilityUseCase } from '../../core/interfaces/use-cases/IAvailabilityUseCase';
import { Availability } from '../../core/entities/Availability';
import { IAvailabilityRepository } from '../../core/interfaces/repositories/IAvailabilityRepository';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { IPatientRepository } from '../../core/interfaces/repositories/IPatientRepository';
import { ValidationError, NotFoundError } from '../../utils/errors';
import {
  SetAvailabilityRequestDTO,
  UpdateSlotRequestDTO,
  AvailabilityResponseDTO,
  SetAvailabilityResponseDTO,
} from '../dtos/AvailabilityDTOs';
import { IAppointmentRepository } from '../../core/interfaces/repositories/IAppointmentRepository';
import { IEmailService } from '../../core/interfaces/services/IEmailService';
import { AvailabilityMapper } from '../mappers/AvailabilityMapper';
import { DateUtils } from '../../utils/DateUtils';

export class AvailabilityUseCase implements IAvailabilityUseCase {
  constructor(
    private _doctorRepository: IDoctorRepository,
    private _availabilityRepository: IAvailabilityRepository,
    private _appointmentRepository: IAppointmentRepository,
    private _emailService: IEmailService,
    private _patientRepository: IPatientRepository
  ) {}

  private async _notifyPatient(appointmentId: string, message: string): Promise<void> {
    const appointment = await this._appointmentRepository.findById(appointmentId);
    if (appointment) {
      const patient = await this._patientRepository.findById(appointment.patientId.toString());
      if (!patient || !patient.email) {
        throw new NotFoundError('Patient email not found');
      }
      await this._emailService.sendEmail(patient.email, 'Appointment Update', message);
    } else {
      throw new NotFoundError('Appointment not found');
    }
  }

  async setAvailability(doctorId: string, dto: SetAvailabilityRequestDTO): Promise<SetAvailabilityResponseDTO> {
    if (!doctorId || !dto.date || !dto.timeSlots || dto.timeSlots.length === 0) {
      throw new ValidationError('Doctor ID, date, and time slots are required');
    }

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    if (dto.isRecurring && (!dto.recurringEndDate || !dto.recurringDays || dto.recurringDays.length === 0)) {
      throw new ValidationError('Recurring end date and days are required for recurring availability');
    }

    for (const slot of dto.timeSlots) {
      DateUtils.validateTimeSlot(slot.startTime, slot.endTime, new Date(dto.date));
    }

    DateUtils.checkOverlappingSlots(dto.timeSlots, new Date(dto.date));

    const conflicts: { date: string; error: string }[] = [];
    const availabilities: AvailabilityResponseDTO[] = [];

    if (dto.isRecurring) {
      const dates = DateUtils.generateRecurringDates(
        new Date(dto.date),
        new Date(dto.recurringEndDate!),
        dto.recurringDays!
      );
      for (const currentDate of dates) {
        const startOfDay = DateUtils.startOfDayUTC(currentDate);
        const existingAvailability = await this._availabilityRepository.findByDoctorAndDate(doctorId, startOfDay);

        const existingSlots = existingAvailability ? [...existingAvailability.timeSlots] : [];
        const newTimeSlots = [...existingSlots, ...dto.timeSlots.map((slot) => ({ ...slot, isBooked: false }))];

        try {
          DateUtils.checkOverlappingSlots(newTimeSlots, startOfDay);
        } catch (error) {
          conflicts.push({ date: startOfDay.toISOString(), error: (error as Error).message });
          continue;
        }

        const newAvailability: Availability = {
          doctorId,
          date: startOfDay,
          timeSlots: newTimeSlots,
        };

        try {
          const savedAvailability = existingAvailability
            ? await this._availabilityRepository.update(existingAvailability._id!, newAvailability)
            : await this._availabilityRepository.create(newAvailability);
          if (savedAvailability) {
            availabilities.push(AvailabilityMapper.toAvailabilityResponseDTO(savedAvailability));
          } else {
            conflicts.push({ date: startOfDay.toISOString(), error: 'Failed to save availability' });
          }
        } catch (error) {
          conflicts.push({ date: startOfDay.toISOString(), error: (error as Error).message });
        }
      }
      return { availabilities, conflicts };
    } else {
      const startOfDay = DateUtils.startOfDayUTC(new Date(dto.date));
      const existingAvailability = await this._availabilityRepository.findByDoctorAndDate(doctorId, startOfDay);

      const existingSlots = existingAvailability ? [...existingAvailability.timeSlots] : [];
      const newTimeSlots = [...existingSlots, ...dto.timeSlots.map((slot) => ({ ...slot, isBooked: false }))];

      try {
        DateUtils.checkOverlappingSlots(newTimeSlots, startOfDay);
      } catch (error) {
        conflicts.push({ date: startOfDay.toISOString(), error: (error as Error).message });
        return { availabilities: [], conflicts };
      }

      const newAvailability: Availability = {
        doctorId,
        date: startOfDay,
        timeSlots: newTimeSlots,
      };

      try {
        const savedAvailability = existingAvailability
          ? await this._availabilityRepository.update(existingAvailability._id!, newAvailability)
          : await this._availabilityRepository.create(newAvailability);
        if (savedAvailability) {
          return { availabilities: [AvailabilityMapper.toAvailabilityResponseDTO(savedAvailability)], conflicts };
        } else {
          conflicts.push({ date: startOfDay.toISOString(), error: 'Failed to save availability' });
          return { availabilities: [], conflicts };
        }
      } catch (error) {
        conflicts.push({ date: startOfDay.toISOString(), error: (error as Error).message });
        return { availabilities: [], conflicts };
      }
    }
  }

  async getAvailability(doctorId: string, startDate: Date, endDate: Date): Promise<AvailabilityResponseDTO[]> {
    if (!doctorId || !startDate || !endDate) {
      throw new ValidationError('Doctor ID, start date, and end date are required');
    }

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    const availabilities = await this._availabilityRepository.findByDoctorAndDateRange(doctorId, startDate, endDate);
    return availabilities.map((availability) => AvailabilityMapper.toAvailabilityResponseDTO(availability));
  }

  async getDoctorAvailability(
    doctorId: string,
    startDate: Date,
    endDate: Date,
    filterBooked: boolean
  ): Promise<AvailabilityResponseDTO[]> {
    if (!doctorId || !startDate || !endDate) {
      throw new ValidationError('Doctor ID, start date, and end date are required');
    }

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    const availabilities = await this._availabilityRepository.findByDoctorAndDateRange(doctorId, startDate, endDate);
    const mappedAvailabilities = availabilities.map((availability) =>
      AvailabilityMapper.toAvailabilityResponseDTO(availability)
    );
    if (filterBooked) {
      return mappedAvailabilities.map((availability) => ({
        ...availability,
        timeSlots: availability.timeSlots.filter((slot) => !slot.isBooked),
      }));
    }
    return mappedAvailabilities;
  }

  async removeSlot(
    availabilityId: string,
    slotIndex: number,
    doctorId: string,
    reason?: string
  ): Promise<AvailabilityResponseDTO | null> {
    if (!availabilityId || slotIndex < 0 || !doctorId) {
      throw new ValidationError('Availability ID, slot index, and doctor ID are required');
    }

    const availability = await this._availabilityRepository.findById(availabilityId);
    if (!availability) {
      throw new NotFoundError('Availability not found');
    }

    if (availability.doctorId !== doctorId) {
      throw new ValidationError('Unauthorized to modify this availability');
    }

    if (slotIndex >= availability.timeSlots.length) {
      throw new ValidationError('Invalid slot index');
    }

    const slot = availability.timeSlots[slotIndex];
    if (slot.isBooked) {
      if (!reason) {
        throw new ValidationError('Reason is required to remove a booked slot');
      }
      const appointment = await this._appointmentRepository.findByDoctorAndSlot(
        doctorId,
        availability.date,
        slot.startTime,
        slot.endTime
      );
      if (appointment) {
        await this._appointmentRepository.update(appointment._id!, { status: 'cancelled', cancellationReason: reason });
        await this._notifyPatient(
          appointment._id!,
          `Your appointment on ${availability.date.toISOString()} at ${slot.startTime} has been cancelled. Reason: ${reason}`
        );
      }
    }

    availability.timeSlots.splice(slotIndex, 1);
    if (availability.timeSlots.length === 0) {
      await this._availabilityRepository.delete(availabilityId);
      return null;
    }

    const updatedAvailability = await this._availabilityRepository.update(availabilityId, {
      timeSlots: availability.timeSlots,
    });
    return updatedAvailability ? AvailabilityMapper.toAvailabilityResponseDTO(updatedAvailability) : null;
  }

  async updateSlot(
    availabilityId: string,
    slotIndex: number,
    newSlot: UpdateSlotRequestDTO,
    doctorId: string,
    reason?: string
  ): Promise<AvailabilityResponseDTO | null> {
    if (!availabilityId || slotIndex < 0 || !newSlot.startTime || !newSlot.endTime || !doctorId) {
      throw new ValidationError('Availability ID, slot index, new slot details, and doctor ID are required');
    }

    const availability = await this._availabilityRepository.findById(availabilityId);
    if (!availability) {
      throw new NotFoundError('Availability not found');
    }

    if (availability.doctorId !== doctorId) {
      throw new ValidationError('Unauthorized to modify this availability');
    }

    if (slotIndex >= availability.timeSlots.length) {
      throw new ValidationError('Invalid slot index');
    }

    const oldSlot = availability.timeSlots[slotIndex];
    if (oldSlot.isBooked) {
      if (!reason) {
        throw new ValidationError('Reason is required to update a booked slot');
      }
      const appointment = await this._appointmentRepository.findByDoctorAndSlot(
        doctorId,
        availability.date,
        oldSlot.startTime,
        oldSlot.endTime
      );
      if (appointment) {
        await this._appointmentRepository.update(appointment._id!, {
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
        });
        await this._notifyPatient(
          appointment._id!,
          `Your appointment on ${availability.date.toISOString()} has been updated to ${newSlot.startTime} - ${newSlot.endTime}. Reason: ${reason}`
        );
      }
    }

    DateUtils.validateTimeSlot(newSlot.startTime, newSlot.endTime, availability.date);
    const tempSlots = [...availability.timeSlots];
    tempSlots[slotIndex] = { ...newSlot, isBooked: oldSlot.isBooked ?? false };
    DateUtils.checkOverlappingSlots(tempSlots, availability.date);

    availability.timeSlots[slotIndex] = AvailabilityMapper.toTimeSlotEntity({
      ...newSlot,
      isBooked: oldSlot.isBooked ?? false,
    });
    const updatedAvailability = await this._availabilityRepository.update(availabilityId, {
      timeSlots: availability.timeSlots,
    });
    return updatedAvailability ? AvailabilityMapper.toAvailabilityResponseDTO(updatedAvailability) : null;
  }
}
