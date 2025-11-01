import axios from 'axios';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';

function createImportUrl(importKey) {
  if (typeof importKey !== 'string' || !importKey.trim()) {
    throw new Error('Missing Živý obraz import key.');
  }

  const trimmedKey = importKey.trim();
  return `http://in.zivyobraz.eu/?import_key=${encodeURIComponent(trimmedKey)}`;
}

export function createUploader(importKey) {
  const baseUrl = createImportUrl(importKey);

  return function uploadData(queryString) {
    const suffix = queryString ? `&${queryString}` : '';
    const finalUrl = `${baseUrl}${suffix}`;
    console.log('uploadData(): sending request', {
      queryLength: typeof queryString === 'string' ? queryString.length : 0
    });
    return from(axios.post(finalUrl)).pipe(map(response => response.data));
  };
}
