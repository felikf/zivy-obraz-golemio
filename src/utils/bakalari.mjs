import axios from 'axios';
import { from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { startOfUtcDay } from './util.mjs';

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

export function fetchEvents(fromDate, toDate) {
  const baseUrl = getBaseUrl();

  return from(
    (async () => {
      const token = await fetchAccessToken();
      const response = await axios.get(`${baseUrl}/api/3/events`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          from: toIsoDate(fromDate),
          to: toIsoDate(toDate)
        }
      });

      const events = response.data?.Events ?? response.data?.events ?? [];

      return events
        .map(event => ({
          startDate: extractEventStartDate(event),
          endDate: extractEventEndDate(event),
          subjectName: extractSubjectName(event),
          title: extractEventTitle(event),
          description: extractEventDescription(event),
          type: extractEventType(event)
        }))
        .filter(event => isEventWithinRange(event, fromDate, toDate))
        .sort((a, b) => (a.startDate ?? 0) - (b.startDate ?? 0));
    })()
  );
}

function extractEventStartDate(event) {
  const possibleDates = [event?.DateFrom, event?.Start, event?.Date, event?.From, event?.Begin, event?.Since];
  for (const dateString of possibleDates) {
    const parsed = parseDate(dateString);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

function extractEventEndDate(event) {
  const possibleDates = [event?.DateTo, event?.End, event?.To, event?.Finish, event?.Until];
  for (const dateString of possibleDates) {
    const parsed = parseDate(dateString);
    if (parsed) {
      return parsed;
    }
  }

  return extractEventStartDate(event);
}

function extractEventTitle(event) {
  const possibleTitles = [event?.Title, event?.Name, event?.Caption, event?.Description];
  return possibleTitles.find(value => typeof value === 'string' && value.trim())?.trim() ?? 'Neznámá událost';
}

function extractEventDescription(event) {
  const possibleDescriptions = [event?.Description, event?.Note, event?.Content, event?.Text, event?.HomeworkText];
  return possibleDescriptions.find(value => typeof value === 'string' && value.trim())?.trim() ?? '';
}

function extractEventType(event) {
  const type = event?.Type ?? event?.EventType ?? event?.EventKind;
  if (typeof type === 'string' && type.trim()) {
    return type.trim();
  }

  if (typeof type?.Name === 'string' && type.Name.trim()) {
    return type.Name.trim();
  }

  if (typeof type?.Abbrev === 'string' && type.Abbrev.trim()) {
    return type.Abbrev.trim();
  }

  return '';
}

function isEventWithinRange(event, fromDate, toDate) {
  if (!event.startDate) {
    return false;
  }

  const startOfEventDay = startOfUtcDay(event.startDate);
  const startOfFromDay = startOfUtcDay(fromDate);
  const startOfToDay = startOfUtcDay(toDate);

  return startOfEventDay >= startOfFromDay && startOfEventDay <= startOfToDay;
}

function parseDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  if (dateValue instanceof Date) {
    return new Date(dateValue.getTime());
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}
