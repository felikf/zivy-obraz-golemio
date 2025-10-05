import { filter, of, tap } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { fetchDepartureData } from './utils/download-golemio.mjs';
import { formatDate } from './utils/util.mjs';
import { uploadData } from './utils/upload.mjs';
import { JESENICE_PLATFORM_B } from './utils/constants.mjs';

const stopId = process.argv[2] || JESENICE_PLATFORM_B;

// Set up an interval to fetch data every n minute
// timer(0, intervalMs)
of(0)
  .pipe(
    tap(() => console.log(`Fetching data: ${formatDate(new Date())}, stopId: ${stopId}`)),
    switchMap(() => fetchDepartureData(stopId, -9)),
    filter(queryTimeTable => queryTimeTable.length > 0),
    switchMap(queryTimeTable => uploadData(queryTimeTable)),
    tap(response => console.log('Upload response:', response))
  )
  .subscribe({
    next: () => console.log('Timetable successfully posted.'),
    error: error => console.error('Error occurred:', error)
  });
