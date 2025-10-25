import { map, switchMap, tap } from 'rxjs/operators';
import { fetchHomeworks } from './utils/bakalari.mjs';
import { uploadData } from './utils/upload.mjs';
import { formatDate } from './utils/util.mjs';

const now = new Date();
const fromDate = new Date(now);
fromDate.setUTCHours(0, 0, 0, 0);
const toDate = new Date(fromDate);
toDate.setMonth(toDate.getMonth() + 1);

console.log(
  `Starting: homeworks sync, from ${fromDate.toISOString().split('T')[0]} to ${toDate
    .toISOString()
    .split('T')[0]}`
);

fetchHomeworks(fromDate, toDate)
  .pipe(
    map(homeworks => buildHomeworksQueryString(homeworks, now)),
    tap(queryString => console.log(`Prepared query string: ${queryString}`)),
    switchMap(queryString => uploadData(queryString)),
    tap(response => console.log('Upload response:', response))
  )
  .subscribe({
    next: () => console.log('Homeworks successfully posted.'),
    error: error => console.error('Error occurred during homeworks sync:', error)
  });

function buildHomeworksQueryString(homeworks, generatedAt) {
  if (!Array.isArray(homeworks) || homeworks.length === 0) {
    return [
      `homeworks_line_1=${encodeURIComponent('Žádné nadcházející domácí úkoly.')}`,
      `homeworks_updated=${encodeURIComponent(formatDate(generatedAt))}`
    ].join('&');
  }

  const lines = homeworks.slice(0, 10).map((homework, index) => {
    const indicator = getDeadlineIndicator(generatedAt, homework.dueDate);
    const subject = homework.subjectName;
    const content = (homework.content || 'Bez popisu').replace(/\s+/g, ' ');
    const dueDateText = formatDate(homework.dueDate);
    const line = `[${indicator}] ${subject}: ${content} – ${dueDateText}`;
    return `homeworks_line_${index + 1}=${encodeURIComponent(line)}`;
  });

  lines.push(`homeworks_updated=${encodeURIComponent(formatDate(generatedAt))}`);

  return lines.join('&');
}

function getDeadlineIndicator(referenceDate, dueDate) {
  const startOfReferenceDay = startOfUtcDay(referenceDate);
  const startOfDueDay = startOfUtcDay(dueDate);
  const diffInDays = Math.round((startOfDueDay - startOfReferenceDay) / (24 * 60 * 60 * 1000));

  if (diffInDays <= 0) {
    return 'dnes';
  }

  if (diffInDays === 1) {
    return 'zítra';
  }

  return 'později';
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
