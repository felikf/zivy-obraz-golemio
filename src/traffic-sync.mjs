import { filter, tap, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { fetchDepartureData } from './utils/download-golemio.mjs';
import { formatDate } from './utils/util.mjs';
import { uploadData } from './utils/upload.mjs';
import { JESENICE_PLATFORM_B } from './utils/constants.mjs';

const stopId = process.argv[2] || JESENICE_PLATFORM_B;
const intervalTime = parseInt(process.argv[3]) || 5;
const intervalMs = intervalTime * 60 * 1000;

console.log(`Fetching data: ${formatDate(new Date())}`);

fetchDepartureData(stopId, -9, stopId).then(queryTimeTable => {
  if (queryTimeTable.length > 0) {
  uploadData(queryTimeTable)
}
console.log('Timetable successfully posted.')
}).catchError(err => {
  console.error('Error fetching or uploading data:', err);
});


