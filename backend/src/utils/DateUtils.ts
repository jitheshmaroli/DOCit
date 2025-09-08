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

  static combineDateAndTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }

  // Get start of day in UTC
  static startOfDayUTC(date: Date): Date {
    return moment.utc(date).startOf('day').toDate();
  }

  // Get end of day in UTC
  static endOfDayUTC(date: Date): Date {
    return moment.utc(date).endOf('day').toDate();
  }

  // Get start of month in UTC
  static startOfMonthUTC(date: Date): Date {
    return moment.utc(date).startOf('month').toDate();
  }

  // Get start of year in UTC
  static startOfYearUTC(date: Date): Date {
    return moment.utc(date).startOf('year').toDate();
  }

  // Validate if date is today or in the future
  static isFutureDate(date: Date): boolean {
    return moment.utc(date).isSame(moment.utc(), 'day') || moment.utc(date).isAfter(moment.utc());
  }

  static formatToTime(date: Date | string): string {
    return moment.utc(date).format('h:mm A');
  }

  static validateTimeSlot(startTime: string, endTime: string, date: Date): void {
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

  static checkOverlappingSlots(slots: { startTime: string; endTime: string }[], date: Date): void {
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
          (slot1.end.isAfter(slot2.start) && (slot1.end.isSame(slot2.end) || slot1.end.isBefore(slot2.end))) ||
          ((slot1.start.isSame(slot2.start) || slot1.start.isBefore(slot2.start)) && slot1.end.isSameOrAfter(slot2.end))
        ) {
          throw new ValidationError('Time slots cannot overlap');
        }
      }
    }
  }

  static generateRecurringDates(startDate: Date, endDate: Date, recurringDays: number[]): Date[] {
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

    return dates;
  }
}
