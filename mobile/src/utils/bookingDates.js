export function toDateKey(date) {
  const d = new Date(date);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatDisplayDate(dateKey) {
  if (!dateKey) return 'Select date';
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function toServerDateString(date) {
  if (typeof date === 'string') return date;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isWithinRange(dateKey, range) {
  const date = new Date(`${dateKey}T12:00:00`);
  const start = new Date(range.startDate);
  const end = new Date(range.endDate);
  end.setHours(23, 59, 59, 999);
  return date >= start && date <= end;
}

export function calculateRentalDays(startKey, endKey) {
  if (!startKey || !endKey) return 0;
  const start = new Date(`${startKey}T12:00:00`);
  const end = new Date(`${endKey}T12:00:00`);
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff + 1 : 0;
}

export function pickCalendarDate(dateKey, startKey, endKey) {
  if (!startKey || (startKey && endKey) || dateKey < startKey) {
    return { startDate: dateKey, endDate: '' };
  }
  return { startDate: startKey, endDate: dateKey };
}
