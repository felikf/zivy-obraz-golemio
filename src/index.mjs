import { filter, tap, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { fetchDepartureData } from './download-golemio.mjs';
import { getRandomProverb } from './proverb.mjs';
import { formatDate } from './util.mjs';
import { uploadData } from './upload.mjs';
import { JESENICE_PLATFORM_B } from './constants.mjs';

const intervalTime = parseInt(process.argv[2]) || 5;
const intervalMs = intervalTime * 60 * 1000;

console.log(`Starting: timetable fetch interval ${intervalMs / 1000 / 60}m`);

// Set up an interval to fetch data every n minute
timer(0, intervalMs)
  .pipe(
    tap(() => console.log(`Fetching data: ${formatDate(new Date())}`)),
    switchMap(() => fetchDepartureData(JESENICE_PLATFORM_B, -9)),
    filter(queryTimeTable => queryTimeTable.length > 0),
    switchMap(queryTimeTable => uploadData(queryTimeTable))
  )
  .subscribe({
    next: () => console.log('Timetable successfully posted.'),
    error: error => console.error('Error occurred:', error)
  });

timer(0, 10 * intervalMs)
  .pipe(
    map(() => `foo=${encodeURIComponent(getRandomProverb())}`),
    switchMap(queryString => uploadData(queryString))
  )
  .subscribe({
    next: () => console.log('Proverb successfully posted.'),
    error: error => console.error('Error occurred:', error)
  });

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('exit', code => {
  console.log(`Process exiting with code: ${code}`);
});
