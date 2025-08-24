import { IAvailabilityUseCase } from '../interfaces/use-cases/IAvailabilityUseCase';
import { Availability } from '../entities/Availability';
import { IAvailabilityRepository } from '../interfaces/repositories/IAvailabilityRepository';
import { IDoctorRepository } from '../interfaces/repositories/IDoctorRepository';
import { ValidationError, NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';
import moment from 'moment';
import {
  SetAvailabilityRequestDTO,
  UpdateSlotRequestDTO,
  AvailabilityResponseDTO,
  SetAvailabilityResponseDTO,
} from '../interfaces/AvailabilityDTOs';
import { AvailabilityMapper } from '../interfaces/mappers/AvailabilityMapper';

export class AvailabilityUseCase implements IAvailabilityUseCase {
  constructor(
    private _doctorRepository: IDoctorRepository,
    private _availabilityRepository: IAvailabilityRepository
  ) {}

  // Validate time slot (startTime and endTime in HH:mm format)
  private _validateTimeSlot(startTime: string, endTime: string, date: Date): void {
    if (!startTime || !endTime) {
      throw new ValidationError('Start time and end time are required');
    }

    const dateStr = moment.utc(date).format('YYYY-MM-DD');
    const slotStart = moment.utc(`${dateStr} ${startTime}`, 'YYYY-MM-DD HH:mm', true);
    const slotEnd = moment.utc(`${dateStr} ${endTime}`, 'YYYY-MM-DD HH:mm', true);

    if (!slotStart.isValid() || !slotEnd.isValid()) {
      throw new ValidationError('Invalid time format. Use HH:mm (e.g., 09:00)');
    }

    if (slotStart.isSameOrAfter(slotEnd)) {
      throw new ValidationError('Start time must be before end time');
    }

    if (moment.utc(date).isSame(moment.utc(), 'day') && slotStart.isBefore(moment.utc())) {
      throw new ValidationError('Cannot set slots before current time');
    }
  }

  // Check for overlapping slots
  private _checkOverlappingSlots(slots: { startTime: string; endTime: string }[], date: Date): void {
    const slotMoments = slots
      .map((slot) => ({
        start: moment.utc(`${moment.utc(date).format('YYYY-MM-DD')} ${slot.startTime}`, 'YYYY-MM-DD HH:mm', true),
        end: moment.utc(`${moment.utc(date).format('YYYY-MM-DD')} ${slot.endTime}`, 'YYYY-MM-DD HH:mm', true),
      }))
      .filter((slot) => slot.start.isValid() && slot.end.isValid())
      .sort((a, b) => a.start.diff(b.start));

    slotMoments.forEach((slot, index) => {
      if (!slot.start.isValid() || !slot.end.isValid()) {
        throw new ValidationError(`Invalid time format for slot at index ${index}`);
      }
    });

    for (let i = 0; i < slotMoments.length; i++) {
      for (let j = i + 1; j < slotMoments.length; j++) {
        const slot1 = slotMoments[i];
        const slot2 = slotMoments[j];
        if (
          (slot1.start.isSameOrAfter(slot2.start) && slot1.start.isBefore(slot2.end)) ||
          (slot1.end.isAfter(slot2.start) && slot1.end.isSameOrBefore(slot2.end)) ||
          (slot1.start.isSameOrBefore(slot2.start) && slot1.end.isSameOrAfter(slot2.end))
        ) {
          throw new ValidationError('Time slots cannot overlap');
        }
      }
    }
    logger.info(
      'Checked slots for overlaps:',
      slotMoments.map((slot) => ({
        start: slot.start.format('HH:mm'),
        end: slot.end.format('HH:mm'),
      }))
    );
  }

  // Get start of day in UTC
  private startOfDayUTC(date: Date): Date {
    return moment.utc(date).startOf('day').toDate();
  }

  // Generate recurring dates based on start date, end date, and selected days of the week
  private generateRecurringDates(startDate: Date, endDate: Date, recurringDays: number[]): Date[] {
    if (!recurringDays || recurringDays.length === 0) {
      throw new ValidationError('At least one recurring day is required');
    }
    const dates: Date[] = [];
    let currentDate = moment.utc(startDate);
    const end = moment.utc(endDate);

    while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
      if (recurringDays.includes(currentDate.day())) {
        dates.push(currentDate.toDate());
      }
      currentDate = currentDate.add(1, 'day');
    }

    logger.debug(
      'Generated recurring dates:',
      dates.map((d) => moment.utc(d).format('YYYY-MM-DD'))
    );
    return dates;
  }

  async setAvailability(doctorId: string, dto: SetAvailabilityRequestDTO): Promise<SetAvailabilityResponseDTO> {
    if (!doctorId || !dto.date || !dto.timeSlots || dto.timeSlots.length === 0) {
      logger.error('Missing required fields for setting availability');
      throw new ValidationError('Doctor ID, date, and time slots are required');
    }

    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      logger.error(`Doctor not found: ${doctorId}`);
      throw new NotFoundError('Doctor not found');
    }

    if (dto.isRecurring && (!dto.recurringEndDate || !dto.recurringDays || dto.recurringDays.length === 0)) {
      logger.error('Recurring availability requires end date and days');
      throw new ValidationError('Recurring end date and days are required for recurring availability');
    }

    for (const slot of dto.timeSlots) {
      this._validateTimeSlot(slot.startTime, slot.endTime, new Date(dto.date));
    }

    this._checkOverlappingSlots(dto.timeSlots, new Date(dto.date));

    const conflicts: { date: string; error: string }[] = [];
    const availabilities: AvailabilityResponseDTO[] = [];

    if (dto.isRecurring) {
      const dates = this.generateRecurringDates(
        new Date(dto.date),
        new Date(dto.recurringEndDate!),
        dto.recurringDays!
      );
      for (const currentDate of dates) {
        const startOfDay = this.startOfDayUTC(currentDate);
        const existingAvailability = await this._availabilityRepository.findByDoctorAndDate(doctorId, startOfDay);
        if (existingAvailability && !dto.forceCreate) {
          conflicts.push({
            date: startOfDay.toISOString(),
            error: 'Availability already exists for this date',
          });
          continue;
        }

        const newAvailability: Availability = {
          doctorId,
          date: startOfDay,
          timeSlots: dto.timeSlots.map((slot) => ({ ...slot, isBooked: false })),
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
          logger.error(`Error saving availability for date ${startOfDay}: ${(error as Error).message}`);
          conflicts.push({ date: startOfDay.toISOString(), error: (error as Error).message });
        }
      }
      return { availabilities, conflicts };
    } else {
      const startOfDay = this.startOfDayUTC(new Date(dto.date));
      const existingAvailability = await this._availabilityRepository.findByDoctorAndDate(doctorId, startOfDay);
      if (existingAvailability && !dto.forceCreate) {
        conflicts.push({ date: startOfDay.toISOString(), error: 'Availability already exists for this date' });
        return { availabilities: [], conflicts };
      }

      const newAvailability = AvailabilityMapper.toAvailabilityEntity({ ...dto, date: dto.date }, doctorId);

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
        logger.error(`Error saving availability for date ${startOfDay}: ${(error as Error).message}`);
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
    doctorId: string
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

    if (availability.timeSlots[slotIndex].isBooked) {
      throw new ValidationError('Cannot remove a booked slot');
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
    doctorId: string
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

    if (availability.timeSlots[slotIndex].isBooked) {
      throw new ValidationError('Cannot update a booked slot');
    }

    this._validateTimeSlot(newSlot.startTime, newSlot.endTime, availability.date);
    const tempSlots = [...availability.timeSlots];
    tempSlots[slotIndex] = { ...newSlot, isBooked: false };
    this._checkOverlappingSlots(tempSlots, availability.date);

    availability.timeSlots[slotIndex] = AvailabilityMapper.toTimeSlotEntity({ ...newSlot, isBooked: false });
    const updatedAvailability = await this._availabilityRepository.update(availabilityId, {
      timeSlots: availability.timeSlots,
    });
    return updatedAvailability ? AvailabilityMapper.toAvailabilityResponseDTO(updatedAvailability) : null;
  }
}
