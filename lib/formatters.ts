export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function formatShortDate(value: Date | string | null | undefined) {
  if (!value) {
    return "None";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function daysSince(value: Date | string | null | undefined, now = new Date()) {
  if (!value) {
    return null;
  }

  const then = new Date(value).getTime();
  const diff = now.getTime() - then;
  return Math.max(0, Math.floor(diff / 86_400_000));
}

export function formatRelativeDays(value: Date | string | null | undefined, now = new Date()) {
  const days = daysSince(value, now);

  if (days === null) {
    return "No activity";
  }

  if (days === 0) {
    return "Today";
  }

  if (days === 1) {
    return "Yesterday";
  }

  return `${days} days ago`;
}
