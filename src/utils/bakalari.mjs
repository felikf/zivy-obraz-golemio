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
    homework?.DateEnd ??
    homework?.Date ??
    homework?.Created ??
    homework?.CreatedDate ??
    homework?.DateStart;

  if (!dateString) {
    console.info('No due date found in homework:', homework);
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

  function fetchTimetableForDay(date) {
    const targetDay = startOfUtcDay(date);

    return from(
      (async () => {
        const token = await fetchAccessToken();
        const response = await axios.get(`${baseUrl}/api/3/timetable/actual`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            date: toIsoDate(targetDay)
          }
        });

        const days = response.data?.Days ?? response.data?.days ?? [];
        const day = findMatchingTimetableDay(days, targetDay) ?? {};
        const lessons = extractLessonsFromTimetableDay(day, targetDay);

        return lessons.sort((first, second) => compareLessons(first, second));
      })()
    );
  }

  return {
    fetchSubjectMarks,
    fetchHomeworks,
    fetchEvents,
    fetchTimetableForDay
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

function findMatchingTimetableDay(days, targetDay) {
  return days.find(day => {
    const dayDate = parseDate(day?.Date ?? day?.DayDate ?? day?.date ?? day?.dayDate);
    return dayDate && startOfUtcDay(dayDate).getTime() === targetDay.getTime();
  });
}

function extractLessonsFromTimetableDay(day, targetDay) {
  const rawLessons = day?.Atoms ?? day?.Lessons ?? day?.atoms ?? day?.lessons ?? [];

  return rawLessons
    .map(lesson => ({
      order: extractLessonOrder(lesson),
      subjectName: extractSubjectName(lesson),
      group: extractLessonGroup(lesson),
      teacher: extractTeacherName(lesson),
      room: extractRoomName(lesson),
      startTime: extractLessonStart(lesson, targetDay),
      endTime: extractLessonEnd(lesson, targetDay),
      removed: isLessonRemoved(lesson),
      note: extractLessonNote(lesson)
    }))
    .filter(lesson => Boolean(lesson.subjectName) || Boolean(lesson.room) || lesson.order !== null);
}

function extractLessonOrder(lesson) {
  const possibleOrders = [lesson?.Hour, lesson?.hour, lesson?.Period, lesson?.period, lesson?.Order, lesson?.order];
  const found = possibleOrders.find(value => Number.isInteger(Number(value)));
  return typeof found === 'undefined' ? null : Number(found);
}

function extractLessonGroup(lesson) {
  const groupCandidates = [lesson?.Group, lesson?.group];
  for (const candidate of groupCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }

    if (typeof candidate?.Abbrev === 'string' && candidate.Abbrev.trim()) {
      return candidate.Abbrev.trim();
    }

    if (typeof candidate?.Name === 'string' && candidate.Name.trim()) {
      return candidate.Name.trim();
    }
  }

  return '';
}

function extractTeacherName(lesson) {
  const teacherCandidates = [lesson?.Teacher, lesson?.teacher];
  for (const candidate of teacherCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }

    if (typeof candidate?.Abbrev === 'string' && candidate.Abbrev.trim()) {
      return candidate.Abbrev.trim();
    }

    if (typeof candidate?.Name === 'string' && candidate.Name.trim()) {
      return candidate.Name.trim();
    }
  }

  return '';
}

function extractRoomName(lesson) {
  const roomCandidates = [lesson?.Room, lesson?.room];
  for (const candidate of roomCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }

    if (typeof candidate?.Abbrev === 'string' && candidate.Abbrev.trim()) {
      return candidate.Abbrev.trim();
    }

    if (typeof candidate?.Name === 'string' && candidate.Name.trim()) {
      return candidate.Name.trim();
    }
  }

  return '';
}

function extractLessonStart(lesson, defaultDay) {
  const startDate =
    parseDate(lesson?.BeginTime ?? lesson?.StartTime ?? lesson?.Begin ?? lesson?.TimeFrom ?? lesson?.From ?? lesson?.start) ??
    createTimeFromHour(lesson?.HourFrom, defaultDay);

  return startDate ?? null;
}

function extractLessonEnd(lesson, defaultDay) {
  const endDate =
    parseDate(lesson?.EndTime ?? lesson?.Finish ?? lesson?.End ?? lesson?.TimeTo ?? lesson?.To ?? lesson?.end) ??
    createTimeFromHour(lesson?.HourTo, defaultDay);

  return endDate ?? null;
}

function createTimeFromHour(hourString, defaultDay) {
  if (typeof hourString !== 'string') {
    return null;
  }

  const trimmed = hourString.trim();
  const [hourPart, minutePart] = trimmed.split(':');

  const hour = Number(hourPart);
  const minute = Number(minutePart);

  if (!Number.isInteger(hour) || Number.isNaN(minute)) {
    return null;
  }

  const base = startOfUtcDay(defaultDay);
  base.setUTCHours(hour, minute, 0, 0);

  return base;
}

function isLessonRemoved(lesson) {
  return Boolean(
    lesson?.IsCancelled ??
      lesson?.IsCanceled ??
      lesson?.Removed ??
      lesson?.IsRemoved ??
      lesson?.Change?.IsCancelled ??
      lesson?.Change?.IsCanceled ??
      lesson?.change?.isCanceled ??
      lesson?.change?.isCancelled
  );
}

function extractLessonNote(lesson) {
  const changeCandidates = [
    lesson?.Change?.Description,
    lesson?.Change?.DescriptionShort,
    lesson?.Change?.ChangeDescription,
    lesson?.Change?.Note,
    lesson?.Change?.Reason,
    lesson?.ChangeText,
    lesson?.changeText
  ];

  const changeNote = changeCandidates.find(value => typeof value === 'string' && value.trim())?.trim();
  if (changeNote) {
    return changeNote;
  }

  const noteCandidates = [lesson?.Note, lesson?.note, lesson?.Description, lesson?.description];
  return noteCandidates.find(value => typeof value === 'string' && value.trim())?.trim() ?? '';
}

function compareLessons(first, second) {
  const firstOrder = Number.isInteger(first.order) ? first.order : Number.MAX_SAFE_INTEGER;
  const secondOrder = Number.isInteger(second.order) ? second.order : Number.MAX_SAFE_INTEGER;

  if (firstOrder !== secondOrder) {
    return firstOrder - secondOrder;
  }

  const firstStart = first.startTime instanceof Date ? first.startTime.getTime() : Number.MAX_SAFE_INTEGER;
  const secondStart = second.startTime instanceof Date ? second.startTime.getTime() : Number.MAX_SAFE_INTEGER;

  return firstStart - secondStart;
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
