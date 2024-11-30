import axios from 'axios';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';

const IMPORT_KEY = process.env.IMPORT_KEY;

const OUTPUT_URL_BASE = `http://in.zivyobraz.eu/?import_key=${IMPORT_KEY}`;

export function uploadData(queryString) {
  const finalUrl = `${OUTPUT_URL_BASE}&${queryString}`;
  return from(axios.post(finalUrl)).pipe(map(response => response.data));
}
