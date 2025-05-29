import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);

export class DateUtils {
  static combineDateAndTime(dateStr: string, timeStr: string): Date {
    const date = dayjs.utc(dateStr).format('YYYY-MM-DD');
    return dayjs.utc(`${date} ${timeStr}`, 'YYYY-MM-DD HH:mm').toDate();
  }

  static parseToUTC(dateStr: string | Date): Date {
    return dayjs.utc(dateStr).toDate();
  }

  static formatToISO(date: Date): string {
    return dayjs.utc(date).toISOString();
  }

  static formatToLocalDisplay(date: Date): string {
    return dayjs(date).format('MMMM D, YYYY');
  }

  static formatToLocal(dateStr: string): string {
    if (!dateStr || dateStr === 'Invalid Date') return 'Unknown Date';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unknown Date';
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  static formatTimeToLocal(timeStr: string, date?: string): string {
    if (!timeStr) return 'Unknown Time';
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const dateObj = date ? new Date(date) : new Date();
      dateObj.setHours(hours, minutes);
      return dateObj.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'Unknown Time';
    }
  }

  static getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  static toLocalDate(date: Date): Date {
    return dayjs.utc(date).local().toDate();
  }

  static isFutureDate(date: Date): boolean {
    return (
      dayjs.utc(date).isSame(dayjs.utc(), 'day') ||
      dayjs.utc(date).isAfter(dayjs.utc())
    );
  }

  static checkOverlappingSlots(
    slots: { startTime: string; endTime: string }[],
    date: Date
  ): boolean {
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const slot1 = slots[i];
        const slot2 = slots[j];
        const start1 = dayjs.utc(
          `${dayjs.utc(date).format('YYYY-MM-DD')} ${slot1.startTime}`
        );
        const end1 = dayjs.utc(
          `${dayjs.utc(date).format('YYYY-MM-DD')} ${slot1.endTime}`
        );
        const start2 = dayjs.utc(
          `${dayjs.utc(date).format('YYYY-MM-DD')} ${slot2.startTime}`
        );
        const end2 = dayjs.utc(
          `${dayjs.utc(date).format('YYYY-MM-DD')} ${slot2.endTime}`
        );

        if (
          (start1.isSameOrAfter(start2) && start1.isBefore(end2)) ||
          (end1.isAfter(start2) &&
            (end1.isSame(end2) || end1.isBefore(end2))) ||
          ((start1.isSame(start2) || start1.isBefore(start2)) &&
            end1.isSameOrAfter(end2))
        ) {
          return true;
        }
      }
    }
    return false;
  }
}
