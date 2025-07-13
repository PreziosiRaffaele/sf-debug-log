/**
 * Utility functions for extracting values from Apex debug log lines.
 * These helpers are intentionally stateless and reusable across the code-base.
 */

/**
 * Extract the timestamp (in milliseconds) from the execution time part of a log line.
 * Example execution time part: "07:29:05.123 (813678225)" -> returns 813.678225
 */
export function extractTimestamp(executionTimePart: string): number {
  const start = executionTimePart.indexOf('(') + 1;
  const end = executionTimePart.indexOf(')');
  if (start <= 0 || end <= start) return 0;

  const timestampText = executionTimePart.substring(start, end).trim();
  const timestampNs = parseFloat(timestampText);
  return Number.isFinite(timestampNs) ? timestampNs / 1_000_000 : 0; // convert ns to ms
}

/**
 * Extract the line number from a section like "[12]".
 */
export function extractLineNumber(lineNumberPart: string): number {
  const start = lineNumberPart.indexOf('[') + 1;
  const end = lineNumberPart.indexOf(']');
  if (start <= 0 || end <= start) return 0;

  const lineNumberText = lineNumberPart.substring(start, end).trim();
  return Number(lineNumberText);
}

/**
 * Extract the sObject name targeted by a SOQL query.
 * Attempts to match the first token after the FROM clause.
 */
export function extractObject(soqlString: string): string {
  if (!soqlString || typeof soqlString !== 'string') {
    return '';
  }

  const cleanQuery = soqlString.trim();
  const fromRegex = /\bselect\b.*?\bfrom\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)/i;
  const match = cleanQuery.match(fromRegex);
  return match?.[1] ? match[1].trim() : '';
}

/**
 * Extract the number of rows from strings like "Rows: 5" or "@37:5".
 */
export function extractRows(rowsString: string): number {
  if (!rowsString || typeof rowsString !== 'string') {
    return 0;
  }

  const parts = rowsString.split(':');
  if (parts.length < 2) {
    return 0;
  }

  const parsed = parseInt(parts[1].trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

