export function formatDate(timeStamp) {
  return new Intl.DateTimeFormat('cs-CZ', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Europe/Prague'
  }).format(timeStamp);
}

export function formatTime(timeStamp) {
  return new Date(timeStamp).toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Prague'
  });
}

export function getGolemioToken() {
  return process.env.TOKEN;
}

export function getLiveScreenImportKey() {
  return process.env.IMPORT_KEY;
}
