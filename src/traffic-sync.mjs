import { filter, tap, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { fetchDepartureData } from './utils/download-golemio.mjs';
import { formatDate } from './utils/util.mjs';
import { uploadData } from './utils/upload.mjs';
import { JESENICE_PLATFORM_B } from './utils/constants.mjs';

const stopId = process.argv[2] || JESENICE_PLATFORM_B;
const intervalTime = parseInt(process.argv[3]) || 5;
const intervalMs = intervalTime * 60 * 1000;

console.log(`Starting: timetable fetch interval ${intervalMs / 1000 / 60}m, stop ID: ${stopId}`);

// Set up an interval to fetch data every n minute
timer(0, intervalMs)
  .pipe(
    tap(() => console.log(`Fetching data: ${formatDate(new Date())}`)),
    switchMap(() => fetchDepartureData(stopId, -9, stopId)),
    filter(queryTimeTable => queryTimeTable.length > 0),
    switchMap(queryTimeTable => uploadData(queryTimeTable))
  )
  .subscribe({
    next: () => console.log('Timetable successfully posted.'),
    error: error => console.error('Error occurred:', error)
  });
