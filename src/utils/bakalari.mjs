import axios from 'axios';
import { from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { startOfUtcDay } from './util.mjs';

function normalizeConfig({ baseUrl, username, password }) {
  if (typeof baseUrl !== 'string' || !baseUrl.trim()) {
    throw new Error('Missing Bakaláři base URL.');
  }

  if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password.trim()) {
    throw new Error('Missing Bakaláři credentials.');
  }

  return {
    baseUrl: baseUrl.trim().replace(/\/$/, ''),
    username: username.trim(),
    password: password.trim()
  };
}

function toIsoDate(date) {
  return date.toISOString().split('T')[0];
}

export function createBakalariClient(config) {
  const { baseUrl, username, password } = normalizeConfig(config);

  async function fetchAccessToken() {
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

  function fetchSubjectMarks(fromDate, toDate) {
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

  function fetchHomeworks(fromDate, toDate) {
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

  function fetchEvents(fromDate, toDate) {
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

  return {
    fetchSubjectMarks,
    fetchHomeworks,
    fetchEvents
  };
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
