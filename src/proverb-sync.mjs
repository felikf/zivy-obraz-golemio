import { parseArgs } from 'node:util';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { getRandomProverb } from './utils/proverb.mjs';
import { createUploader } from './utils/upload.mjs';

const { values, positionals } = parseArgs({
  options: {
    'import-key': { type: 'string' },
    'wrap-length': { type: 'string' }
  },
  allowPositionals: true
});

const importKey = values['import-key'] ?? positionals[0];
const wrapLengthRaw = values['wrap-length'] ?? positionals[1];

if (!importKey) {
  throw new Error('Usage: node src/proverb-sync.mjs <importKey> [wrapLength]');
}

const wrapLength = Number.parseInt(wrapLengthRaw, 10) || 0;

const uploadData = createUploader(importKey);

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
