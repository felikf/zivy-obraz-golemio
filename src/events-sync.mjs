import { parseArgs } from 'node:util';
import { map, switchMap, tap } from 'rxjs/operators';
import { createBakalariClient } from './utils/bakalari.mjs';
import { createUploader } from './utils/upload.mjs';
import { describeRelativeDay, formatDate, formatTime, startOfUtcDay } from './utils/util.mjs';

const { values, positionals } = parseArgs({
  options: {
    'bakalari-base-url': { type: 'string' },
    'bakalari-username': { type: 'string' },
    'bakalari-password': { type: 'string' },
    'import-key': { type: 'string' },
    'events-line-prefix': { type: 'string' },
    'events-updated-param': { type: 'string' }
  },
  allowPositionals: true
});

function resolveValue(name, index) {
  return values[name] ?? positionals[index];
}

function resolveWithDefault(name, index, fallback) {
  const candidate = resolveValue(name, index);
  return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : fallback;
}

const bakalariBaseUrl = resolveValue('bakalari-base-url', 0);
const bakalariUsername = resolveValue('bakalari-username', 1);
const bakalariPassword = resolveValue('bakalari-password', 2);
const importKey = resolveValue('import-key', 3);

if (!bakalariBaseUrl || !bakalariUsername || !bakalariPassword || !importKey) {
  throw new Error(
    'Usage: node src/events-sync.mjs <bakalariBaseUrl> <username> <password> <importKey> [linePrefix] [updatedParam]'
  );
}

const eventsLinePrefix = resolveWithDefault('events-line-prefix', 4, 'events_line');
const eventsUpdatedParam = resolveWithDefault('events-updated-param', 5, 'events_updated');

const { fetchEvents } = createBakalariClient({
  baseUrl: bakalariBaseUrl,
  username: bakalariUsername,
  password: bakalariPassword
});

const uploadData = createUploader(importKey);

const now = new Date();
const fromDate = startOfUtcDay(now);
const toDate = new Date(fromDate);
toDate.setMonth(toDate.getMonth() + 1);

console.log(
  `Starting: events sync, from ${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`
);

fetchEvents(fromDate, toDate)
  .pipe(
    map(events => buildEventsQueryString(events, now, eventsLinePrefix, eventsUpdatedParam)),
    tap(queryString => console.log(`Prepared query string: ${queryString}`)),
    switchMap(queryString => uploadData(queryString)),
    tap(response => console.log('Upload response:', response))
  )
  .subscribe({
    next: () => console.log('Events successfully posted.'),
    error: error => console.error('Error occurred during events sync:', error)
  });

function buildEventsQueryString(events, generatedAt, linePrefix, updatedParam) {
  if (!Array.isArray(events) || events.length === 0) {
    return [
      `${linePrefix}_1=${encodeURIComponent('Žádné plánované zkoušky ani akce.')}`,
      `${updatedParam}=${encodeURIComponent(formatDate(generatedAt))}`
    ].join('&');
  }

  const lines = events.slice(0, 10).map((event, index) => {
    const indicator = describeRelativeDay(generatedAt, event.startDate);
    const line = formatEventLine(event, indicator);
    return `${linePrefix}_${index + 1}=${encodeURIComponent(line)}`;
  });

  lines.push(`${updatedParam}=${encodeURIComponent(formatDate(generatedAt))}`);

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
