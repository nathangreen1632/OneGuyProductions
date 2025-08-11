export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function isWithin72Hours(isoDate: string): boolean {
  const createdAt = Date.parse(isoDate);

  if (isNaN(createdAt)) {
    console.warn('⚠️ isWithin72Hours received invalid date string:', isoDate);
    return false;
  }

  const now = Date.now();
  const diff = now - createdAt;

  return diff < 72 * 60 * 60 * 1000;
}

export function formatReadableDate(isoDate: string): string {
  const parsed = Date.parse(isoDate);

  if (isNaN(parsed)) {
    console.warn('⚠️ formatReadableDate received invalid date string:', isoDate);
    return isoDate;
  }

  return new Date(parsed).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
