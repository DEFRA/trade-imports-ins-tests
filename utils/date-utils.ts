import type { DateInput, DateTimeInput } from '@domain/types/date-time-input';

/**
 * Date utility functions for test automation
 */

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
 * Gets a date-picker value relative to now, in the `dd/mm/yyyy` shape the
 * arrival-date and date-of-issue inputs accept.
 */
export function getRelativeDatePickerValue(options: RelativeDateTimeOptions = {}): string {
  const { day, month, year } = getRelativeDateInput(options);
  return `${day}/${month}/${year}`;
}

const SERVICE_TIME_ZONE = 'Europe/London';

function todayInServiceZone(): { year: number; month: number; day: number } {
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
 * Gets a date relative to today in the `d/m/yyyy` shape the app itself renders —
 * no leading zeros, and month arithmetic clamped to the last day of the target
 * month. Anchored on the Europe/London civil day, matching the frontend's
 * `arrivalWindow`. Use this when asserting against app output such as the date
 * picker's `data-min-date`.
 */
export function getRelativeAppDateText({
  dayOffset = 0,
  monthOffset = 0,
}: Pick<RelativeDateTimeOptions, 'dayOffset' | 'monthOffset'> = {}): string {
  const { year, month, day } = todayInServiceZone();
  const targetMonth = month - 1 + monthOffset;
  // Day 0 of the following month is the last day of the target month.
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
 * Gets the service-zone civil date `dayOffset` days from today, formatted the
 * way the app renders long dates (`10 September 2026`). The frontend builds
 * this with `toLocaleDateString('en-GB', { day: 'numeric', month: 'long',
 * year: 'numeric', timeZone: 'Europe/London' })`, so anchor on the
 * Europe/London civil day and format the resulting UTC instant in UTC.
 */
export function getRelativeServiceDisplayDate(dayOffset = 0): string {
  const { year, month, day } = todayInServiceZone();
  const target = new Date(Date.UTC(year, month - 1, day + dayOffset));
  return toDisplayDate(target, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/**
 * Converts a DateInput or DateTimeInput into a UTC Date.
 * Missing time parts default to 00:00.
 */
export function toUtcDate(input: DateInput | DateTimeInput): Date {
  const year = Number(input.year);
  // JS months are zero-indexed (0 = Jan).
  const month = Number(input.month) - 1;
  const day = Number(input.day);
  const hour = 'hour' in input ? Number(input.hour) : 0;
  const minute = 'minute' in input ? Number(input.minute) : 0;

  return new Date(Date.UTC(year, month, day, hour, minute, 0, 0));
}
