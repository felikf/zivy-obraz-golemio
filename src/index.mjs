import { filter, tap, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { fetchDepartureData } from './download-golemio.mjs';
import { getRandomProverb } from './proverb.mjs';
import { formatDate } from './util.mjs';
import { uploadData } from './upload.mjs';

const intervalTime = parseInt(process.argv[2]) || 5;
const intervalMs = intervalTime * 60 * 1000;

console.log(`Starting script: interval ${intervalMs / 1000 / 60}m`);

// Set up an interval to fetch data every 10 minutes (600,000 ms)
timer(0, intervalMs)
  .pipe(
    tap(() => console.log(`Fetching data: ${formatDate(new Date())}`)),
    switchMap(() => fetchDepartureData()),
    tap(() => console.log('Data successfully fetched.')),
    filter(queryTimeTable => queryTimeTable.length > 0),
    map(queryTimeTable => {
      return `${queryTimeTable}&fetchedTimestamp=${encodeURIComponent(formatDate(new Date()))}&foo=${encodeURIComponent(getRandomProverb())}`;
    }),
    switchMap(queryString => uploadData(queryString))
  )
  .subscribe({
    next: () => console.log('Data successfully posted.'),
    error: error => console.error('Error occurred:', error)
  });
