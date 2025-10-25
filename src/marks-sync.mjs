import { map, switchMap, tap } from 'rxjs/operators';
import { fetchSubjectMarks } from './utils/bakalari.mjs';
import { uploadData } from './utils/upload.mjs';
import { formatDate } from './utils/util.mjs';

const now = new Date();
const fromDate = new Date();
fromDate.setMonth(fromDate.getMonth() - 1);

console.log(`Starting: marks sync, from ${fromDate.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`);

fetchSubjectMarks(fromDate, now)
  .pipe(
    map(subjects => buildMarksQueryString(subjects, now)),
    tap(queryString => console.log(`Prepared query string: ${queryString}`)),
    switchMap(queryString => uploadData(queryString)),
    tap(response => console.log('Upload response:', response))
  )
  .subscribe({
    next: () => console.log('Marks successfully posted.'),
    error: error => console.error('Error occurred during marks sync:', error)
  });

function buildMarksQueryString(subjects, generatedAt) {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    return [
      `grades_line_1=${encodeURIComponent('Žádné nové známky za vybrané období.')}`,
      `grades_updated=${encodeURIComponent(formatDate(generatedAt))}`
    ].join('&');
  }

  const sortedSubjects = [...subjects].sort((a, b) => a.subjectName.localeCompare(b.subjectName, 'cs'));

  const lines = sortedSubjects.slice(0, 10).map((subject, index) => {
    const marksText = subject.marks.join(', ');
    const line = `${subject.subjectName}: ${marksText}`;
    return `grades_line_${index + 1}=${encodeURIComponent(line)}`;
  });

  lines.push(`grades_updated=${encodeURIComponent(formatDate(generatedAt))}`);

  return lines.join('&');
}
