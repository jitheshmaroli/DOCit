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
import { IValidatorService } from '../../core/interfaces/services/IValidatorService';
import moment from 'moment';
import { MAX_REASON_LENGTH, MAX_RECURRING_DAYS } from '../../core/constants/AppConstants';

export class AvailabilityUseCase implements IAvailabilityUseCase {
  constructor(
    private _doctorRepository: IDoctorRepository,
    private _availabilityRepository: IAvailabilityRepository,
    private _appointmentRepository: IAppointmentRepository,
    private _emailService: IEmailService,
    private _patientRepository: IPatientRepository,
    private _validatorService: IValidatorService
  ) {}

  async setAvailability(doctorId: string, dto: SetAvailabilityRequestDTO): Promise<SetAvailabilityResponseDTO> {
    //validations
    this._validatorService.validateRequiredFields({
      doctorId,
      date: dto.date,
      timeSlots: dto.timeSlots,
    });
    this._validatorService.validateIdFormat(doctorId);
    this._validatorService.validateDateFormat(dto.date);

    if (dto.timeSlots.length === 0) {
      throw new ValidationError('At least one time slot is required');
    }

    for (const slot of dto.timeSlots) {
      this._validatorService.validateRequiredFields({
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
      this._validatorService.validateTimeSlot(slot.startTime, slot.endTime);
    }

    if (dto.isRecurring) {
      this._validatorService.validateRequiredFields({
        recurringEndDate: dto.recurringEndDate,
        recurringDays: dto.recurringDays,
      });
      this._validatorService.validateDateFormat(dto.recurringEndDate!);
      if (dto.recurringDays!.length === 0) {
        throw new ValidationError('At least one recurring day is required');
      }

      const startMoment = moment.utc(dto.date);
      const endMoment = moment.utc(dto.recurringEndDate!);
      const daysDiff = endMoment.diff(startMoment, 'days');
      if (daysDiff > MAX_RECURRING_DAYS) {
        throw new ValidationError(`Recurring period cannot exceed ${MAX_RECURRING_DAYS} days`);
      }
    }

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

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
          for (const slot of dto.timeSlots) {
            DateUtils.validateTimeSlot(slot.startTime, slot.endTime, currentDate);
          }
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
        for (const slot of dto.timeSlots) {
          DateUtils.validateTimeSlot(slot.startTime, slot.endTime, new Date(dto.date));
        }
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
    //validations
    this._validatorService.validateRequiredFields({ doctorId, startDate, endDate });
    this._validatorService.validateIdFormat(doctorId);
    this._validatorService.validateDateFormat(startDate.toISOString());
    this._validatorService.validateDateFormat(endDate.toISOString());

    if (startDate > endDate) {
      throw new ValidationError('Start date must be before end date');
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
    //validations
    this._validatorService.validateRequiredFields({ doctorId, startDate, endDate });
    this._validatorService.validateIdFormat(doctorId);
    this._validatorService.validateDateFormat(startDate.toISOString());
    this._validatorService.validateDateFormat(endDate.toISOString());
    this._validatorService.validateBoolean(filterBooked);

    if (startDate > endDate) {
      throw new ValidationError('Start date must be before end date');
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
    //validations
    this._validatorService.validateRequiredFields({ availabilityId, slotIndex, doctorId });
    this._validatorService.validateIdFormat(availabilityId);
    this._validatorService.validateIdFormat(doctorId);
    if (reason) {
      this._validatorService.validateLength(reason, 1, 500);
    }

    const availability = await this._availabilityRepository.findById(availabilityId);
    if (!availability) {
      throw new NotFoundError('Availability not found');
    }

    if (availability.doctorId?.toString() !== doctorId) {
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
          appointment._id!.toString(),
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
    //validations
    this._validatorService.validateRequiredFields({
      availabilityId,
      slotIndex,
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
      doctorId,
    });
    this._validatorService.validateIdFormat(availabilityId);
    this._validatorService.validateIdFormat(doctorId);
    this._validatorService.validatePositiveInteger(slotIndex);
    this._validatorService.validateTimeSlot(newSlot.startTime, newSlot.endTime);
    if (reason) {
      this._validatorService.validateLength(reason, 1, MAX_REASON_LENGTH);
    }

    const availability = await this._availabilityRepository.findById(availabilityId);
    if (!availability) {
      throw new NotFoundError('Availability not found');
    }

    if (availability.doctorId?.toString() !== doctorId) {
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
          appointment._id!.toString(),
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

  private async _notifyPatient(appointmentId: string, message: string): Promise<void> {
    //validations
    this._validatorService.validateRequiredFields({ appointmentId, message });
    this._validatorService.validateIdFormat(appointmentId);
    this._validatorService.validateLength(message, 1, 1000);

    const appointment = await this._appointmentRepository.findById(appointmentId);
    if (appointment) {
      const patient = await this._patientRepository.findById(appointment.patientId!.toString());
      if (!patient || !patient.email) {
        throw new NotFoundError('Patient email not found');
      }
      this._validatorService.validateEmailFormat(patient.email);

      await this._emailService.sendEmail(patient.email, 'Appointment Update', message);
    } else {
      throw new NotFoundError('Appointment not found');
    }
  }
}
