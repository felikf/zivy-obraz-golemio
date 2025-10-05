import axios from 'axios';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import { getLiveScreenImportKey } from './util.mjs';

function prepareUrl() {
  return `http://in.zivyobraz.eu/?import_key=${getLiveScreenImportKey()}`;
}

export function uploadData(queryString) {
  const finalUrl = `${prepareUrl()}&${queryString}`;
  console.log(`uploadData(): finalUrl: ${finalUrl}`);
  return from(axios.post(finalUrl)).pipe(map(response => response.data));
}
