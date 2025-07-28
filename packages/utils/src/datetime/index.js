"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatISODate = formatISODate;
exports.formatReadableDate = formatReadableDate;
exports.formatReadableDateTime = formatReadableDateTime;
exports.getCurrentTimestamp = getCurrentTimestamp;
exports.getDateDiff = getDateDiff;
exports.getDateDiffInSeconds = getDateDiffInSeconds;
exports.getDateDiffInMinutes = getDateDiffInMinutes;
exports.getDateDiffInHours = getDateDiffInHours;
exports.getDateDiffInDays = getDateDiffInDays;
exports.addSeconds = addSeconds;
exports.addMinutes = addMinutes;
exports.addHours = addHours;
exports.addDays = addDays;
/**
 * Format a date as an ISO string
 * @param date Date to format
 * @returns ISO string
 */
function formatISODate(date = new Date()) {
    return date.toISOString();
}
/**
 * Format a date as a human-readable string
 * @param date Date to format
 * @param locale Locale to use
 * @returns Human-readable date string
 */
function formatReadableDate(date = new Date(), locale = 'en-US') {
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
function formatReadableDateTime(date = new Date(), locale = 'en-US') {
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
function getCurrentTimestamp() {
    return Date.now();
}
/**
 * Calculate the difference between two dates in milliseconds
 * @param date1 First date
 * @param date2 Second date (defaults to now)
 * @returns Difference in milliseconds
 */
function getDateDiff(date1, date2 = new Date()) {
    return date2.getTime() - date1.getTime();
}
/**
 * Calculate the difference between two dates in seconds
 * @param date1 First date
 * @param date2 Second date (defaults to now)
 * @returns Difference in seconds
 */
function getDateDiffInSeconds(date1, date2 = new Date()) {
    return Math.floor(getDateDiff(date1, date2) / 1000);
}
/**
 * Calculate the difference between two dates in minutes
 * @param date1 First date
 * @param date2 Second date (defaults to now)
 * @returns Difference in minutes
 */
function getDateDiffInMinutes(date1, date2 = new Date()) {
    return Math.floor(getDateDiffInSeconds(date1, date2) / 60);
}
/**
 * Calculate the difference between two dates in hours
 * @param date1 First date
 * @param date2 Second date (defaults to now)
 * @returns Difference in hours
 */
function getDateDiffInHours(date1, date2 = new Date()) {
    return Math.floor(getDateDiffInMinutes(date1, date2) / 60);
}
/**
 * Calculate the difference between two dates in days
 * @param date1 First date
 * @param date2 Second date (defaults to now)
 * @returns Difference in days
 */
function getDateDiffInDays(date1, date2 = new Date()) {
    return Math.floor(getDateDiffInHours(date1, date2) / 24);
}
/**
 * Add seconds to a date
 * @param date Base date
 * @param seconds Seconds to add
 * @returns New date
 */
function addSeconds(date, seconds) {
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
function addMinutes(date, minutes) {
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
function addHours(date, hours) {
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
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
//# sourceMappingURL=index.js.map