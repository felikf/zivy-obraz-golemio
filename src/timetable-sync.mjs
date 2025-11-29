import { parseArgs } from 'node:util';
import { map, switchMap, tap } from 'rxjs/operators';
import { createBakalariClient } from './utils/bakalari.mjs';
import { createUploader } from './utils/upload.mjs';
import { formatDate, formatTime, startOfUtcDay } from './utils/util.mjs';

const { values, positionals } = parseArgs({
  options: {
    'bakalari-base-url': { type: 'string' },
    'bakalari-username': { type: 'string' },
    'bakalari-password': { type: 'string' },
    'import-key': { type: 'string' },
    'timetable-param': { type: 'string' },
    'timetable-updated-param': { type: 'string' }
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
    'Usage: node src/timetable-sync.mjs <bakalariBaseUrl> <username> <password> <importKey> [timetableParam] [updatedParam]'
  );
}

const timetableParam = resolveWithDefault('timetable-param', 4, 'timetable_ascii');
const timetableUpdatedParam = resolveWithDefault('timetable-updated-param', 5, 'timetable_updated');

const { fetchTimetableForDay } = createBakalariClient({
  baseUrl: bakalariBaseUrl,
  username: bakalariUsername,
  password: bakalariPassword
});

const uploadData = createUploader(importKey);

const now = new Date();
const today = startOfUtcDay(now);

console.log(`Starting: timetable sync for ${today.toISOString().split('T')[0]}`);

fetchTimetableForDay(today)
  .pipe(
    map(lessons => buildTimetableQueryString(lessons, now, timetableParam, timetableUpdatedParam)),
    tap(queryString => console.log(`Prepared query string length: ${queryString.length}`)),
    switchMap(queryString => uploadData(queryString)),
    tap(response => console.log('Upload response:', response))
  )
  .subscribe({
    next: () => console.log('Timetable successfully posted.'),
    error: error => console.error('Error occurred during timetable sync:', error)
  });

function buildTimetableQueryString(lessons, generatedAt, asciiParam, updatedParam) {
  const asciiArt = renderTimetableAsciiArt(lessons, generatedAt);
  const updated = formatDate(generatedAt);

  return [`${asciiParam}=${encodeURIComponent(asciiArt)}`, `${updatedParam}=${encodeURIComponent(updated)}`].join('&');
}

function renderTimetableAsciiArt(lessons, generatedAt) {
  if (!Array.isArray(lessons) || lessons.length === 0) {
    return [
      '+-------------------------------+',
      '| Dnes v rozvrhu nejsou hodiny. |',
      '+-------------------------------+',
      `Aktualizováno: ${formatDate(generatedAt)}`
    ].join('\n');
  }

  const header = '+----------+------------------------------+--------------------------+';
  const lines = [header, '| hodina   | předmět / skupina            | místnost / učitel        |', header];

  lessons.forEach(lesson => {
    const slot = formatLessonSlot(lesson);
    const subject = formatSubjectCell(lesson);
    const details = formatDetailsCell(lesson);
    const status = lesson.removed ? 'X vyjmuto' : 'OK platí';
    const note = lesson.note ? lesson.note : lesson.removed ? 'Vyjmuto z rozvrhu' : '';

    lines.push(`| ${pad(slot, 8)} | ${pad(subject, 28)} | ${pad(status, 24)} |`);
    lines.push(`| ${pad('', 8)} | ${pad(details, 28)} | ${pad(note, 24)} |`);
    lines.push(header);
  });

  lines.push(`Aktualizováno: ${formatDate(generatedAt)}`);

  return lines.join('\n');
}

function formatLessonSlot(lesson) {
  const hourLabel = Number.isInteger(lesson.order) ? `${lesson.order}.` : '??';
  const timeRange = formatLessonTimeRange(lesson.startTime, lesson.endTime);
  return `${hourLabel} ${timeRange}`.trim();
}

function formatLessonTimeRange(startTime, endTime) {
  const formattedStart = formatLessonTime(startTime);
  const formattedEnd = formatLessonTime(endTime);

  if (formattedStart && formattedEnd) {
    return `${formattedStart}-${formattedEnd}`;
  }

  return formattedStart || formattedEnd || '';
}

function formatLessonTime(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return '';
  }

  return formatTime(value);
}

function formatSubjectCell(lesson) {
  const parts = [lesson.subjectName, lesson.group].filter(part => typeof part === 'string' && part.trim());
  if (lesson.removed) {
    parts.push('[zrušeno]');
  }
  return parts.join(' ');
}

function formatDetailsCell(lesson) {
  const details = [lesson.room, lesson.teacher].filter(value => typeof value === 'string' && value.trim());
  return details.join(' | ');
}

function pad(value, width) {
  const safeValue = typeof value === 'string' ? value : '';
  const trimmedLength = Math.max(0, width - 3);
  const sliced = safeValue.length > width ? `${safeValue.slice(0, trimmedLength)}...` : safeValue;
  return sliced.padEnd(width, ' ');
}
