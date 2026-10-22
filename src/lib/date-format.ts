const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

function parseDate(value: string | number | Date) {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(value: string | number | Date) {
  const date = parseDate(value);
  return Number.isNaN(date.getTime()) ? "Invalid Date" : DATE_FORMATTER.format(date);
}

export function formatDateTime(value: string | number | Date) {
  const date = parseDate(value);
  return Number.isNaN(date.getTime()) ? "Invalid Date" : DATE_TIME_FORMATTER.format(date);
}
