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

/**
 * Formats a date string (YYYY-MM-DD or ISO timestamp) to MM-DD-YYYY for display
 */
export const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return "";
  const m = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return dateString;
  return `${m[2]}-${m[3]}-${m[1]}`;
};
