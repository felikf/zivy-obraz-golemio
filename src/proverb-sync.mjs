import { timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { getRandomProverb } from './utils/proverb.mjs';
import { uploadData } from './utils/upload.mjs';

const intervalTime = parseInt(process.argv[2]) || 5;
const intervalMs = intervalTime * 60 * 1000;

let interval = (10 * intervalMs) / 1000 / 60;
console.log(`Starting: proverb fetch interval ${interval}m`);

// Set up an interval to fetch data every n minute
timer(0, intervalMs)
  .pipe(
    map(() => `proverb=${encodeURIComponent(getRandomProverb())}`),
    switchMap(queryString => uploadData(queryString))
  )
  .subscribe({
    next: () => console.log('Proverb successfully posted.'),
    error: error => console.error('Error occurred:', error)
  });
