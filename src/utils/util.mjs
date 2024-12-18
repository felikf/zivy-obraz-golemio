export function formatDate(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${hours}:${minutes} ${day}.${month}.${year}`;
}

export function formatTime(timeStamp) {
  return new Date(timeStamp).toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getGolemioToken() {
  return process.env.TOKEN;
}

export function getLiveScreenImportKey() {
  return process.env.IMPORT_KEY;
}
