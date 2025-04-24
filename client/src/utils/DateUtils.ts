import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);

export class DateUtils {
  // Parse a date string to UTC Date object
  static parseToUTC(dateStr: string | Date): Date {
    return dayjs.utc(dateStr).toDate();
  }

  // Format a Date to ISO 8601 string (UTC)
  static formatToISO(date: Date): string {
    return dayjs.utc(date).toISOString();
  }

  // Format a Date to local display (e.g., MMMM D, YYYY)
  static formatToLocalDisplay(date: Date): string {
    return dayjs(date).format('MMMM D, YYYY');
  }

  // Format time to display as stored (e.g., HH:mm, no timezone conversion)
  static formatTimeToLocal(time: string, date: Date): string {
    console.log('formatTimeToLocal:', { time, date: date.toISOString(), result: time }); // Debugging log
    return time; // Return raw HH:mm time without conversion
  }

  // Get user's timezone
  static getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  // Convert UTC date to local date
  static toLocalDate(date: Date): Date {
    return dayjs.utc(date).local().toDate();
  }

  // Validate if date is today or in the future
  static isFutureDate(date: Date): boolean {
    return dayjs.utc(date).isSame(dayjs.utc(), 'day') || dayjs.utc(date).isAfter(dayjs.utc());
  }

  // Check for overlapping slots
  static checkOverlappingSlots(slots: { startTime: string; endTime: string }[], date: Date): boolean {
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const slot1 = slots[i];
        const slot2 = slots[j];
        const start1 = dayjs.utc(`${dayjs.utc(date).format('YYYY-MM-DD')} ${slot1.startTime}`);
        const end1 = dayjs.utc(`${dayjs.utc(date).format('YYYY-MM-DD')} ${slot1.endTime}`);
        const start2 = dayjs.utc(`${dayjs.utc(date).format('YYYY-MM-DD')} ${slot2.startTime}`);
        const end2 = dayjs.utc(`${dayjs.utc(date).format('YYYY-MM-DD')} ${slot2.endTime}`);

        if (
          (start1.isSameOrAfter(start2) && start1.isBefore(end2)) ||
          (end1.isAfter(start2) && (end1.isSame(end2) || end1.isBefore(end2))) ||
          ((start1.isSame(start2) || start1.isBefore(start2)) && end1.isSameOrAfter(end2))
        ) {
          return true; // Overlap detected
        }
      }
    }
    return false;
  }
}