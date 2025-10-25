import { map, switchMap, tap } from 'rxjs/operators';
import { fetchEvents } from './utils/bakalari.mjs';
import { uploadData } from './utils/upload.mjs';
import { describeRelativeDay, formatDate, formatTime, startOfUtcDay } from './utils/util.mjs';

const now = new Date();
const fromDate = startOfUtcDay(now);
const toDate = new Date(fromDate);
toDate.setMonth(toDate.getMonth() + 1);

console.log(
  `Starting: events sync, from ${fromDate.toISOString().split('T')[0]} to ${toDate
    .toISOString()
    .split('T')[0]}`
);

fetchEvents(fromDate, toDate)
  .pipe(
    map(events => buildEventsQueryString(events, now)),
    tap(queryString => console.log(`Prepared query string: ${queryString}`)),
    switchMap(queryString => uploadData(queryString)),
    tap(response => console.log('Upload response:', response))
  )
  .subscribe({
    next: () => console.log('Events successfully posted.'),
    error: error => console.error('Error occurred during events sync:', error)
  });

function buildEventsQueryString(events, generatedAt) {
  if (!Array.isArray(events) || events.length === 0) {
    return [
      `events_line_1=${encodeURIComponent('Žádné plánované zkoušky ani akce.')}`,
      `events_updated=${encodeURIComponent(formatDate(generatedAt))}`
    ].join('&');
  }

  const lines = events.slice(0, 10).map((event, index) => {
    const indicator = describeRelativeDay(generatedAt, event.startDate);
    const line = formatEventLine(event, indicator);
    return `events_line_${index + 1}=${encodeURIComponent(line)}`;
  });

  lines.push(`events_updated=${encodeURIComponent(formatDate(generatedAt))}`);

  return lines.join('&');
}

function formatEventLine(event, indicator) {
  const { title, subjectName, type, description, startDate, endDate } = event;
  const sanitizedSubject = sanitizeText(subjectName);
  const sanitizedType = sanitizeText(type);
  const labelParts = [sanitizedType, sanitizedSubject].filter(
    value => typeof value === 'string' && value && value !== 'Neznámý předmět'
  );
  const header = labelParts.length > 0 ? `${labelParts.join(' – ')}: ${title}` : title;
  const sanitizedHeader = sanitizeText(header) || 'Událost';
  const sanitizedDescription = sanitizeText(description);
  const dateRangeText = formatEventDateRange(startDate, endDate);

  const base = `[${indicator}] ${sanitizedHeader}`;
  const withDescription = sanitizedDescription ? `${base} – ${sanitizedDescription}` : base;
  return `${withDescription} – ${dateRangeText}`;
}

function sanitizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.replace(/\s+/g, ' ').trim();
}

function formatEventDateRange(startDate, endDate) {
  if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) {
    return 'Neznámé datum';
  }

  if (!(endDate instanceof Date) || Number.isNaN(endDate.getTime()) || endDate.getTime() === startDate.getTime()) {
    return formatDate(startDate);
  }

  const sameDay =
    startDate.getUTCFullYear() === endDate.getUTCFullYear() &&
    startDate.getUTCMonth() === endDate.getUTCMonth() &&
    startDate.getUTCDate() === endDate.getUTCDate();

  if (sameDay) {
    return `${formatDate(startDate)} – ${formatTime(endDate)}`;
  }

  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}
