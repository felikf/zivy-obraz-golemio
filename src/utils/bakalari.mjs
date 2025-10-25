import axios from 'axios';
import { from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

function getBaseUrl() {
  const baseUrl = process.env.BAKALARI_BASE_URL;
  if (!baseUrl) {
    throw new Error('Missing environment variable BAKALARI_BASE_URL');
  }

  console.log('baseUrl:', baseUrl.replace(/\/$/, ''));

  return baseUrl.replace(/\/$/, '');
}

function getCredentials() {
  const username = process.env.BAKALARI_USERNAME;
  const password = process.env.BAKALARI_PASSWORD;

  if (!username || !password) {
    throw new Error('Missing environment variables BAKALARI_USERNAME or BAKALARI_PASSWORD');
  }

  return { username, password };
}

function toIsoDate(date) {
  return date.toISOString().split('T')[0];
}

async function fetchAccessToken() {
  const baseUrl = getBaseUrl();
  const { username, password } = getCredentials();

  const body = new URLSearchParams({
    client_id: 'ANDR',
    grant_type: 'password',
    username,
    password
  });

  const response = await axios.post(`${baseUrl}/api/login`, body, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (!response.data?.access_token) {
    throw new Error('Bakaláři login did not return an access token.');
  }

  return response.data.access_token;
}

function extractSubjectName(subject) {
  return subject?.Subject?.Abbrev ?? subject?.Subject?.Name ?? subject?.Name ?? subject?.Abbrev ?? 'Neznámý předmět';
}

function extractMarkValue(mark) {
  return (
    mark?.MarkText ??
    mark?.Text ??
    mark?.Caption ??
    mark?.ValueText ??
    (typeof mark?.Value !== 'undefined' ? String(mark.Value) : undefined) ??
    (typeof mark?.Mark !== 'undefined' ? String(mark.Mark) : undefined) ??
    ''
  );
}

function isMarkWithinRange(mark, fromDate, toDate) {
  const dateString = mark?.MarkDate ?? mark?.Date ?? mark?.Created ?? mark?.CreatedDate;
  if (!dateString) {
    return false;
  }
  const markDate = new Date(dateString);
  if (Number.isNaN(markDate.getTime())) {
    return false;
  }

  return markDate >= fromDate && markDate <= toDate;
}

export function fetchSubjectMarks(fromDate, toDate) {
  const baseUrl = getBaseUrl();

  return from(fetchAccessToken()).pipe(
    switchMap(token =>
      axios.get(`${baseUrl}/api/3/marks`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          from: toIsoDate(fromDate),
          to: toIsoDate(toDate)
        }
      })
    ),
    map(response => response.data?.Subjects ?? response.data?.subjects ?? []),
    map(subjects =>
      subjects
        .map(subject => {
          const subjectName = extractSubjectName(subject);
          const marks = (subject?.Marks ?? subject?.marks ?? [])
            .filter(mark => isMarkWithinRange(mark, fromDate, toDate))
            .map(mark => extractMarkValue(mark))
            .filter(value => value);

          return { subjectName, marks };
        })
        .filter(subject => subject.marks.length > 0)
    )
  );
}
