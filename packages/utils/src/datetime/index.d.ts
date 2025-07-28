/**
 * Format a date as an ISO string
 * @param date Date to format
 * @returns ISO string
 */
export declare function formatISODate(date?: Date): string;
/**
 * Format a date as a human-readable string
 * @param date Date to format
 * @param locale Locale to use
 * @returns Human-readable date string
 */
export declare function formatReadableDate(date?: Date, locale?: string): string;
/**
 * Format a date as a human-readable date and time string
 * @param date Date to format
 * @param locale Locale to use
 * @returns Human-readable date and time string
 */
export declare function formatReadableDateTime(date?: Date, locale?: string): string;
/**
 * Get the current timestamp in milliseconds
 * @returns Current timestamp
 */
export declare function getCurrentTimestamp(): number;
/**
 * Calculate the difference between two dates in milliseconds
 * @param date1 First date
 * @param date2 Second date (defaults to now)
 * @returns Difference in milliseconds
 */
export declare function getDateDiff(date1: Date, date2?: Date): number;
/**
 * Calculate the difference between two dates in seconds
 * @param date1 First date
 * @param date2 Second date (defaults to now)
 * @returns Difference in seconds
 */
export declare function getDateDiffInSeconds(date1: Date, date2?: Date): number;
/**
 * Calculate the difference between two dates in minutes
 * @param date1 First date
 * @param date2 Second date (defaults to now)
 * @returns Difference in minutes
 */
export declare function getDateDiffInMinutes(date1: Date, date2?: Date): number;
/**
 * Calculate the difference between two dates in hours
 * @param date1 First date
 * @param date2 Second date (defaults to now)
 * @returns Difference in hours
 */
export declare function getDateDiffInHours(date1: Date, date2?: Date): number;
/**
 * Calculate the difference between two dates in days
 * @param date1 First date
 * @param date2 Second date (defaults to now)
 * @returns Difference in days
 */
export declare function getDateDiffInDays(date1: Date, date2?: Date): number;
/**
 * Add seconds to a date
 * @param date Base date
 * @param seconds Seconds to add
 * @returns New date
 */
export declare function addSeconds(date: Date, seconds: number): Date;
/**
 * Add minutes to a date
 * @param date Base date
 * @param minutes Minutes to add
 * @returns New date
 */
export declare function addMinutes(date: Date, minutes: number): Date;
/**
 * Add hours to a date
 * @param date Base date
 * @param hours Hours to add
 * @returns New date
 */
export declare function addHours(date: Date, hours: number): Date;
/**
 * Add days to a date
 * @param date Base date
 * @param days Days to add
 * @returns New date
 */
export declare function addDays(date: Date, days: number): Date;
//# sourceMappingURL=index.d.ts.map