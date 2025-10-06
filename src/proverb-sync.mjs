import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { getRandomProverb } from './utils/proverb.mjs';
import { uploadData } from './utils/upload.mjs';

const wrapLength = parseInt(process.argv[2]) || 0;

console.log(`Starting: proverb sync, wrap length: ${wrapLength}`);

// Set up an interval to fetch data every n minute
// timer(0, intervalMs)
of(true)
  .pipe(
    map(() => getRandomProverb(wrapLength)),
    map(
      proverb => `proverb=${encodeURIComponent(proverb.proverb)}&proverbAuthor=${encodeURIComponent(proverb.author)}`
    ),
    switchMap(queryString => uploadData(queryString))
  )
  .subscribe({
    next: queryString => console.log(`Proverb successfully posted: ${queryString}`),
    error: error => console.error('Error occurred:', error)
  });
