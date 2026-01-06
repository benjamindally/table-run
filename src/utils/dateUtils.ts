/**
 * Date utility functions for handling date strings without timezone issues
 */

/**
 * Formats a date string (YYYY-MM-DD) to a localized date string
 * Avoids timezone conversion issues by treating the input as a local date
 */
export const formatLocalDate = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
};

/**
 * Formats a date string (YYYY-MM-DD) to MM/DD/YYYY format
 */
export const formatDateUS = (dateString: string): string => {
  const [year, month, day] = dateString.split('-');
  return `${month}/${day}/${year}`;
};
