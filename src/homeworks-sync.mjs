import { parseArgs } from 'node:util';
import { map, switchMap, tap } from 'rxjs/operators';
import { createBakalariClient } from './utils/bakalari.mjs';
import { createUploader } from './utils/upload.mjs';
import { describeRelativeDay, formatDate, startOfUtcDay } from './utils/util.mjs';

const { values, positionals } = parseArgs({
  options: {
    'bakalari-base-url': { type: 'string' },
    'bakalari-username': { type: 'string' },
    'bakalari-password': { type: 'string' },
    'import-key': { type: 'string' },
    'homeworks-line-prefix': { type: 'string' },
    'homeworks-updated-param': { type: 'string' }
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
    'Usage: node src/homeworks-sync.mjs <bakalariBaseUrl> <username> <password> <importKey> [linePrefix] [updatedParam]'
  );
}

const homeworksLinePrefix = resolveWithDefault('homeworks-line-prefix', 4, 'homeworks_line');
const homeworksUpdatedParam = resolveWithDefault('homeworks-updated-param', 5, 'homeworks_updated');

const { fetchHomeworks } = createBakalariClient({
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
  `Starting: homeworks sync, from ${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`
);

fetchHomeworks(fromDate, toDate)
  .pipe(
    map(homeworks => buildHomeworksQueryString(homeworks, now, homeworksLinePrefix, homeworksUpdatedParam)),
    tap(queryString => console.log(`Prepared query string: ${queryString}`)),
    switchMap(queryString => uploadData(queryString)),
    tap(response => console.log('Upload response:', response))
  )
  .subscribe({
    next: () => console.log('Homeworks successfully posted.'),
    error: error => console.error('Error occurred during homeworks sync:', error)
  });

function buildHomeworksQueryString(homeworks, generatedAt, linePrefix, updatedParam) {
  if (!Array.isArray(homeworks) || homeworks.length === 0) {
    return [
      `${linePrefix}_1=${encodeURIComponent('Žádné nadcházející domácí úkoly.')}`,
      `${updatedParam}=${encodeURIComponent(formatDate(generatedAt))}`
    ].join('&');
  }

  const lines = homeworks.slice(0, 10).map((homework, index) => {
    const indicator = describeRelativeDay(generatedAt, homework.dueDate);
    const subject = homework.subjectName;
    const content = (homework.content || 'Bez popisu').replace(/\s+/g, ' ');
    const dueDateText = formatDate(homework.dueDate);
    const line = `[${indicator}] ${subject}: ${content} – ${dueDateText}`;
    return `${linePrefix}_${index + 1}=${encodeURIComponent(line)}`;
  });

  lines.push(`${updatedParam}=${encodeURIComponent(formatDate(generatedAt))}`);

  return lines.join('&');
}
