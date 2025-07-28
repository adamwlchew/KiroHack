/**
 * Format a date as an ISO string
 * @param date Date to format
 * @returns ISO string
 */
export function formatISODate(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Format a date as a human-readable string
 * @param date Date to format
 * @param locale Locale to use
 * @returns Human-readable date string
 */
export function formatReadableDate(date: Date = new Date(), locale: string = 'en-US'): string {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a date as a human-readable date and time string
 * @param date Date to format
 * @param locale Locale to use
 * @returns Human-readable date and time string
 */
export function formatReadableDateTime(date: Date = new Date(), locale: string = 'en-US'): string {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Get the current timestamp in milliseconds
 * @returns Current timestamp
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * Calculate the difference between two dates in milliseconds
 * @param date1 First date
 * @param date2 Second date (defaults to now)
 * @returns Difference in milliseconds
 */
export function getDateDiff(date1: Date, date2: Date = new Date()): number {
  return date2.getTime() - date1.getTime();
}

/**
 * Calculate the difference between two dates in seconds
 * @param date1 First date
 * @param date2 Second date (defaults to now)
 * @returns Difference in seconds
 */
export function getDateDiffInSeconds(date1: Date, date2: Date = new Date()): number {
  return Math.floor(getDateDiff(date1, date2) / 1000);
}

/**
 * Calculate the difference between two dates in minutes
 * @param date1 First date
 * @param date2 Second date (defaults to now)
 * @returns Difference in minutes
 */
export function getDateDiffInMinutes(date1: Date, date2: Date = new Date()): number {
  return Math.floor(getDateDiffInSeconds(date1, date2) / 60);
}

/**
 * Calculate the difference between two dates in hours
 * @param date1 First date
 * @param date2 Second date (defaults to now)
 * @returns Difference in hours
 */
export function getDateDiffInHours(date1: Date, date2: Date = new Date()): number {
  return Math.floor(getDateDiffInMinutes(date1, date2) / 60);
}

/**
 * Calculate the difference between two dates in days
 * @param date1 First date
 * @param date2 Second date (defaults to now)
 * @returns Difference in days
 */
export function getDateDiffInDays(date1: Date, date2: Date = new Date()): number {
  return Math.floor(getDateDiffInHours(date1, date2) / 24);
}

/**
 * Add seconds to a date
 * @param date Base date
 * @param seconds Seconds to add
 * @returns New date
 */
export function addSeconds(date: Date, seconds: number): Date {
  const result = new Date(date);
  result.setSeconds(result.getSeconds() + seconds);
  return result;
}

/**
 * Add minutes to a date
 * @param date Base date
 * @param minutes Minutes to add
 * @returns New date
 */
export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

/**
 * Add hours to a date
 * @param date Base date
 * @param hours Hours to add
 * @returns New date
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Add days to a date
 * @param date Base date
 * @param days Days to add
 * @returns New date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}