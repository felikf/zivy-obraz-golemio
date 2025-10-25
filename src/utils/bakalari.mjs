import axios from 'axios';
import { from } from 'rxjs';

function getBaseUrl() {
  const baseUrl = process.env.BAKALARI_BASE_URL;
  if (!baseUrl) {
    throw new Error('Missing environment variable BAKALARI_BASE_URL');
  }
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
  return subject?.Subject?.Name ?? subject?.Subject?.Abbrev ?? subject?.Name ?? subject?.Abbrev ?? 'Neznámý předmět';
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

  return from(
    (async () => {
      const token = await fetchAccessToken();
      const response = await axios.get(`${baseUrl}/api/3/marks`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          from: toIsoDate(fromDate),
          to: toIsoDate(toDate)
        }
      });

      const subjects = response.data?.Subjects ?? response.data?.subjects ?? [];

      return subjects
        .map(subject => {
          const subjectName = extractSubjectName(subject);
          const marks = (subject?.Marks ?? subject?.marks ?? [])
            .filter(mark => isMarkWithinRange(mark, fromDate, toDate))
            .map(mark => extractMarkValue(mark))
            .filter(value => value);

          return { subjectName, marks };
        })
        .filter(subject => subject.marks.length > 0);
    })()
  );
}

function extractHomeworkDueDate(homework) {
  const dateString =
    homework?.DueDate ??
    homework?.Deadline ??
    homework?.Due ??
    homework?.Date ??
    homework?.Created ??
    homework?.CreatedDate;

  if (!dateString) {
    return null;
  }

  const dueDate = new Date(dateString);
  if (Number.isNaN(dueDate.getTime())) {
    return null;
  }

  return dueDate;
}

function extractHomeworkContent(homework) {
  const possibleContents = [
    homework?.HomeworkText,
    homework?.Text,
    homework?.Description,
    homework?.Title,
    homework?.Content,
    homework?.Note,
    homework?.Name
  ];

  return possibleContents.find(value => typeof value === 'string' && value.trim())?.trim() ?? '';
}

function isHomeworkWithinRange(homework, fromDate, toDate) {
  const dueDate = extractHomeworkDueDate(homework);
  if (!dueDate) {
    return false;
  }

  const startOfDueDay = startOfUtcDay(dueDate);
  const startOfFromDay = startOfUtcDay(fromDate);
  const startOfToDay = startOfUtcDay(toDate);

  return startOfDueDay >= startOfFromDay && startOfDueDay <= startOfToDay;
}

export function fetchHomeworks(fromDate, toDate) {
  const baseUrl = getBaseUrl();

  return from(
    (async () => {
      const token = await fetchAccessToken();
      const response = await axios.get(`${baseUrl}/api/3/homeworks`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          from: toIsoDate(fromDate),
          to: toIsoDate(toDate)
        }
      });

      const homeworks = response.data?.Homeworks ?? response.data?.homeworks ?? [];

      return homeworks
        .filter(homework => isHomeworkWithinRange(homework, fromDate, toDate))
        .map(homework => ({
          subjectName: extractSubjectName(homework),
          dueDate: extractHomeworkDueDate(homework),
          content: extractHomeworkContent(homework)
        }))
        .filter(homework => homework.dueDate)
        .sort((a, b) => a.dueDate - b.dueDate);
    })()
  );
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
