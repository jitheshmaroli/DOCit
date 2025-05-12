import moment from 'moment';
import { ValidationError } from './errors';

export class DateUtils {
  // Parse a date string to UTC Date object
  static parseToUTC(dateStr: string | Date): Date {
    if (!dateStr) throw new ValidationError('Date is required');
    const date = moment.utc(dateStr).toDate();
    if (isNaN(date.getTime())) throw new ValidationError('Invalid date format');
    return date;
  }

  // Format a Date to ISO 8601 string (UTC)
  static formatToISO(date: Date): string {
    return moment.utc(date).toISOString();
  }

  // Get start of day in UTC
  static startOfDayUTC(date: Date): Date {
    return moment.utc(date).startOf('day').toDate();
  }

  // Get end of day in UTC
  static endOfDayUTC(date: Date): Date {
    return moment.utc(date).endOf('day').toDate();
  }

  // Validate if date is today or in the future
  static isFutureDate(date: Date): boolean {
    return moment.utc(date).isSame(moment.utc(), 'day') || moment.utc(date).isAfter(moment.utc());
  }

  // Validate time slot (startTime and endTime in HH:mm format)
  static validateTimeSlot(startTime: string, endTime: string, date: Date): void {
    // Ensure inputs are valid
    if (!startTime || !endTime) {
      throw new ValidationError('Start time and end time are required');
    }

    // Parse times with strict format
    const dateStr = moment.utc(date).format('YYYY-MM-DD');
    const slotStart = moment.utc(`${dateStr} ${startTime}`, 'YYYY-MM-DD HH:mm', true);
    const slotEnd = moment.utc(`${dateStr} ${endTime}`, 'YYYY-MM-DD HH:mm', true);

    // Check if parsing was successful
    if (!slotStart.isValid() || !slotEnd.isValid()) {
      throw new ValidationError('Invalid time format. Use HH:mm (e.g., 09:00)');
    }

    // Check if startTime is before endTime
    if (slotStart.isSameOrAfter(slotEnd)) {
      throw new ValidationError('Start time must be before end time');
    }

    // Prevent slots in the past for today
    if (moment.utc(date).isSame(moment.utc(), 'day') && slotStart.isBefore(moment.utc())) {
      throw new ValidationError('Cannot set slots before current time');
    }
  }

  // Check for overlapping slots
  static checkOverlappingSlots(slots: { startTime: string; endTime: string }[], date: Date): void {
    const slotMoments = slots
      .map((slot) => ({
        start: moment.utc(`${moment.utc(date).format('YYYY-MM-DD')} ${slot.startTime}`, 'YYYY-MM-DD HH:mm', true),
        end: moment.utc(`${moment.utc(date).format('YYYY-MM-DD')} ${slot.endTime}`, 'YYYY-MM-DD HH:mm', true),
      }))
      .filter((slot) => slot.start.isValid() && slot.end.isValid())
      .sort((a, b) => a.start.diff(b.start));

    // Validate slot parsing
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
    console.log(
      'Checked slots for overlaps:',
      slotMoments.map((slot) => ({
        start: slot.start.format('HH:mm'),
        end: slot.end.format('HH:mm'),
      }))
    ); // Debugging log
  }
}
