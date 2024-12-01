import axios from 'axios';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';

import { formatDate, formatTime, getGolemioToken } from './util.mjs';

const DEPARTURE_URL =
  'http://api.golemio.cz/v2/pid/departureboards?ids=PLATFORM_PLACEHOLDER&total=5&preferredTimezone=Europe%2FPrague&minutesBefore=MINUTES_BEFORE_PLACEHOLDER';

const OPTIONS = {
  headers: {
    accept: 'application/json; charset=utf-8',
    'x-access-token': getGolemioToken()
  }
};

function prepareUrl(platform, minutesBefore) {
  return DEPARTURE_URL.replace('PLATFORM_PLACEHOLDER', platform).replace('MINUTES_BEFORE_PLACEHOLDER', minutesBefore);
}

// Function to fetch departure data
export const fetchDepartureData = (platform, minutesBefore) => {
  let url = prepareUrl(platform, minutesBefore);
  return from(axios.get(url, OPTIONS)).pipe(
    map(response => `${mapDepartureData(response.data)}&fetchedTimestamp=${encodeURIComponent(formatDate(new Date()))}`)
  );
};

// Function to extract and map the required data to URL query parameters
const mapDepartureData = data => {
  if (!data.departures || data.departures.length === 0) {
    return '';
  }

  return data.departures
    .map(departure => {
      const scheduled = formatTime(departure.arrival_timestamp.scheduled);
      const delayMinutes = departure.delay.minutes || '';
      const routeShortName = departure.route.short_name;

      return {
        scheduled,
        delayMinutes,
        routeShortName
      };
    })
    .filter(item => ['332', '339', '335', '337', '334'].some(linkName => item.routeShortName.indexOf(linkName) > -1))
    .map(({ scheduled, delayMinutes, routeShortName }) =>
      [
        { name: 'scheduled', value: scheduled },
        { name: 'delay_minutes', value: delayMinutes },
        { name: 'route_short_name', value: routeShortName }
      ]
        .map((item, index) => `c_${index + 1}_${item.name}=${encodeURIComponent(item.value)}`)
        .join('&')
    )
    .join('&');
};
