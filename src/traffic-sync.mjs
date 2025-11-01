import { parseArgs } from 'node:util';
import { filter, of, tap } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { createDepartureFetcher } from './utils/download-golemio.mjs';
import { formatDate } from './utils/util.mjs';
import { createUploader } from './utils/upload.mjs';

const { values, positionals } = parseArgs({
  options: {
    'stop-id': { type: 'string' },
    'import-key': { type: 'string' },
    'golemio-token': { type: 'string' },
    'departure-prefix': { type: 'string' }
  },
  allowPositionals: true
});

function resolveValue(name, index) {
  return values[name] ?? positionals[index];
}

function resolveWithDefault(name, index, fallback) {
  const candidate = resolveValue(name, index);
  return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : fallback;
}

const stopId = resolveValue('stop-id', 0);
const importKey = resolveValue('import-key', 1);
const golemioToken = resolveValue('golemio-token', 2);

if (!stopId || !importKey || !golemioToken) {
  throw new Error(
    'Usage: node src/traffic-sync.mjs <stopId> <importKey> <golemioToken> [departurePrefix]'
  );
}

const departurePrefix = resolveWithDefault('departure-prefix', 3, stopId);

const fetchDepartureData = createDepartureFetcher(golemioToken);
const uploadData = createUploader(importKey);

// Set up an interval to fetch data every n minute
// timer(0, intervalMs)
of(0)
  .pipe(
    tap(() =>
      console.log(
        `Fetching data: ${formatDate(new Date())}, stopId: ${stopId}, departurePrefix: ${departurePrefix}`
      )
    ),
    switchMap(() => fetchDepartureData(stopId, -9, departurePrefix)),
    filter(queryTimeTable => queryTimeTable.length > 0),
    switchMap(queryTimeTable => uploadData(queryTimeTable)),
    tap(response => console.log('Upload response:', response))
  )
  .subscribe({
    next: () => console.log('Timetable successfully posted.'),
    error: error => console.error('Error occurred:', error)
  });
