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

export function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function describeRelativeDay(referenceDate, targetDate) {
  if (!(targetDate instanceof Date) || Number.isNaN(targetDate.getTime())) {
    return 'neznámo';
  }

  const startOfReferenceDay = startOfUtcDay(referenceDate);
  const startOfTargetDay = startOfUtcDay(targetDate);
  const diffInDays = Math.round((startOfTargetDay - startOfReferenceDay) / (24 * 60 * 60 * 1000));

  if (diffInDays <= 0) {
    return 'dnes';
  }

  if (diffInDays === 1) {
    return 'zítra';
  }

  const suffix = diffInDays >= 5 ? 'dní' : 'dny';
  return `za ${diffInDays} ${suffix}`;
}

