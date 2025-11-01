import axios from 'axios';
import { from, tap } from 'rxjs';
import { map } from 'rxjs/operators';

import { formatDate, formatTime } from './util.mjs';

const DEPARTURE_URL =
  'http://api.golemio.cz/v2/pid/departureboards?ids=PLATFORM_PLACEHOLDER&total=5&preferredTimezone=Europe%2FPrague&minutesBefore=MINUTES_BEFORE_PLACEHOLDER';

function prepareUrl(platform, minutesBefore) {
  return DEPARTURE_URL.replace('PLATFORM_PLACEHOLDER', platform).replace('MINUTES_BEFORE_PLACEHOLDER', minutesBefore);
}

function createOptions(token) {
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('Missing Golemio API token.');
  }

  return {
    headers: {
      accept: 'application/json; charset=utf-8',
      'x-access-token': token.trim()
    }
  };
}

// Function to fetch departure data
export const createDepartureFetcher = token => {
  const options = createOptions(token);

  return (platform, minutesBefore, prefixOverride) => {
    const url = prepareUrl(platform, minutesBefore);
    const prefix = prefixOverride ?? platform;
    return from(axios.get(url, options)).pipe(
      map(
        response =>
          `${mapDepartureData(response.data, prefix)}&fetchedTimestamp=${encodeURIComponent(formatDate(new Date()))}`
      ),
      tap(queryString => console.log(`Fetched data: queryString: ${queryString}`))
    );
  };
};

function mapOneDeparture(departure) {
  {
    const scheduled = formatTime(departure.arrival_timestamp.scheduled);
    const delayMinutes = departure.delay.minutes || 0;
    const routeShortName = departure.route.short_name;
    const headsign = departure.trip.headsign;

    return {
      scheduled,
      delayMinutes,
      routeShortName,
      headsign
    };
  }
}

// Function to extract and map the required data to URL query parameters
function mapDepartureData(data, prefix) {
  if (!data.departures || data.departures.length === 0) {
    return '';
  }
  let index = 1;
  return (
    data.departures
      .map(departure => mapOneDeparture(departure))
      //.filter(item => ['332', '339', '335', '337', '334'].some(linkName => item.routeShortName.indexOf(linkName) > -1))
      .map(data => toQueryString(data, index++, prefix))
      .join('&')
  );
}

function toQueryString({ scheduled, delayMinutes, routeShortName, headsign }, index, prefix) {
  return [
    { name: 'scheduled', value: scheduled },
    { name: 'delay_minutes', value: delayMinutes },
    { name: 'route_short_name', value: routeShortName },
    { name: 'headsign', value: headsign }
  ]
    .map(item => `${prefix}_${index}_${item.name}=${encodeURIComponent(item.value)}`)
    .join('&');
}
