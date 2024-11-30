import axios from 'axios';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';

const TOKEN = process.env.TOKEN;

const DEPARTURE_URL =
  'http://api.golemio.cz/v2/pid/departureboards?ids=U1330Z2&total=5&preferredTimezone=Europe%2FPrague&minutesBefore=-9';

// Function to fetch departure data
export const fetchDepartureData = () => {
  let options = {
    headers: {
      accept: 'application/json; charset=utf-8',
      'x-access-token': TOKEN
    }
  };
  return from(axios.get(DEPARTURE_URL, options)).pipe(map(response => mapDepartureData(response.data)));
};

// Function to extract and map the required data to URL query parameters
export const mapDepartureData = data => {
  if (!data.departures || data.departures.length === 0) {
    return '';
  }

  return data.departures
    .map(departure => {
      const scheduled = new Date(departure.arrival_timestamp.scheduled).toLocaleTimeString('cs-CZ', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const delayMinutes = departure.delay.minutes || 'včas';
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
