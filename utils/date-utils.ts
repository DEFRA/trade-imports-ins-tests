import type { DateInput, DateTimeInput } from '@domain/shared/types/date-time-input';

export type RelativeDateTimeOptions = {
  dayOffset?: number;
  monthOffset?: number;
  yearOffset?: number;
  hourOffset?: number;
  minuteOffset?: number;
  secondOffset?: number;
};

function toDateTimeInput(date: Date): DateTimeInput {
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: (date.getMonth() + 1).toString().padStart(2, '0'),
    year: date.getFullYear().toString(),
    hour: date.getHours().toString().padStart(2, '0'),
    minute: date.getMinutes().toString().padStart(2, '0'),
  };
}

function toDateInput(date: Date): DateInput {
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: (date.getMonth() + 1).toString().padStart(2, '0'),
    year: date.getFullYear().toString(),
  };
}

/**
 * Gets a Date relative to now with optional time offsets.
 * @param options.dayOffset - Number of days to offset (can be negative, default: 0)
 * @param options.monthOffset - Number of months to offset (can be negative, default: 0)
 * @param options.yearOffset - Number of years to offset (can be negative, default: 0)
 * @param options.hourOffset - Number of hours to offset (can be negative, default: 0)
 * @param options.minuteOffset - Number of minutes to offset (can be negative, default: 0)
 * @param options.secondOffset - Number of seconds to offset (can be negative, default: 0)
 * @returns Date object in local time
 */
export function getRelativeDateTime({
  dayOffset = 0,
  monthOffset = 0,
  yearOffset = 0,
  hourOffset = 0,
  minuteOffset = 0,
  secondOffset = 0,
}: RelativeDateTimeOptions = {}): Date {
  const date = new Date();
  date.setSeconds(date.getSeconds() + secondOffset);
  date.setMinutes(date.getMinutes() + minuteOffset);
  date.setHours(date.getHours() + hourOffset);
  date.setMonth(date.getMonth() + monthOffset);
  date.setFullYear(date.getFullYear() + yearOffset);
  date.setDate(date.getDate() + dayOffset);

  return date;
}

/**
 * Gets a date-time relative to now with optional time offsets
 * @param options.dayOffset - Number of days to offset (can be negative, default: 0)
 * @param options.monthOffset - Number of months to offset (can be negative, default: 0)
 * @param options.yearOffset - Number of years to offset (can be negative, default: 0)
 * @param options.hourOffset - Number of hours to offset (can be negative, default: 0)
 * @param options.minuteOffset - Number of minutes to offset (can be negative, default: 0)
 * @param options.secondOffset - Number of seconds to offset (can be negative, default: 0)
 * @returns Formatted date object with day, month, year, hour, and minute as strings
 */
export function getRelativeDateTimeInput(options: RelativeDateTimeOptions = {}): DateTimeInput {
  return toDateTimeInput(getRelativeDateTime(options));
}

/**
 * Gets a Date relative to now, normalized to 00:00 local time.
 * Time offsets are ignored by design.
 */
export function getRelativeDate({ dayOffset = 0, monthOffset = 0, yearOffset = 0 }: RelativeDateTimeOptions = {}): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setMonth(date.getMonth() + monthOffset);
  date.setFullYear(date.getFullYear() + yearOffset);
  date.setDate(date.getDate() + dayOffset);

  return date;
}

/**
 * Gets a date-only input relative to now.
 */
export function getRelativeDateInput(options: RelativeDateTimeOptions = {}): DateInput {
  return toDateInput(getRelativeDate(options));
}

/**
 * Gets a date relative to now as `dd/mm/yyyy`, e.g. `05/09/2026`.
 */
export function getRelativeDatePickerValue(options: RelativeDateTimeOptions = {}): string {
  const { day, month, year } = getRelativeDateInput(options);
  return `${day}/${month}/${year}`;
}

function todayInServiceZone(): { year: number; month: number; day: number } {
  const SERVICE_TIME_ZONE = 'Europe/London';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SERVICE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const partValue = (type: Intl.DateTimeFormatPartTypes): number => Number(parts.find((part) => part.type === type).value);
  return { year: partValue('year'), month: partValue('month'), day: partValue('day') };
}

/**
 * Gets the Europe/London civil date `monthOffset` months then `dayOffset` days
 * from today as `d/m/yyyy`, e.g. `5/9/2026`. A month offset clamps the day to the
 * last day of the target month.
 */
export function getRelativeAppDateText({
  dayOffset = 0,
  monthOffset = 0,
}: Pick<RelativeDateTimeOptions, 'dayOffset' | 'monthOffset'> = {}): string {
  const { year, month, day } = todayInServiceZone();
  const targetMonth = month - 1 + monthOffset;
  const lastDayOfTargetMonth = new Date(Date.UTC(year, targetMonth + 1, 0)).getUTCDate();
  const clamped = new Date(Date.UTC(year, targetMonth, Math.min(day, lastDayOfTargetMonth)));
  clamped.setUTCDate(clamped.getUTCDate() + dayOffset);

  return `${clamped.getUTCDate()}/${clamped.getUTCMonth() + 1}/${clamped.getUTCFullYear()}`;
}

/**
 * Formats a Date for display using en-GB locale and optional format options.
 */
export function toDisplayDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  },
): string {
  return new Intl.DateTimeFormat('en-GB', options).format(date);
}

/**
 * Gets the Europe/London civil date `dayOffset` days from today as `d MMMM yyyy`,
 * e.g. `10 September 2026`.
 */
export function getRelativeServiceDisplayDate(dayOffset = 0): string {
  const { year, month, day } = todayInServiceZone();
  const target = new Date(Date.UTC(year, month - 1, day + dayOffset));
  return toDisplayDate(target, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/**
 * Formats a DateInput as `YYYY-MM-DD` from its parts, without a `Date`, e.g. `2026-09-05`.
 */
export function toIsoDate(input: DateInput): string {
  const year = String(input.year).padStart(4, '0');
  const month = String(input.month).padStart(2, '0');
  const day = String(input.day).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/** Splits `d/m/yyyy` text into a DateInput, e.g. `5/9/2026` to `{ day: '5', month: '9', year: '2026' }`. */
export function parseAppDateText(text: string): DateInput {
  const [day, month, year] = text.split('/');
  return { day, month, year };
}

/**
 * Formats a DateInput as `d MMM yyyy`, e.g. `10 Sep 2026`.
 */
export function toShortDisplayDate(input: DateInput): string {
  const SHORT_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(input.day)} ${SHORT_MONTH_NAMES[Number(input.month) - 1]} ${input.year}`;
}

/** A regular-expression group matching today's or tomorrow's service display date, for a date stamped near midnight. */
export function todayOrTomorrowServiceDisplayDatePattern(): string {
  return `(${getRelativeServiceDisplayDate()}|${getRelativeServiceDisplayDate(1)})`;
}
