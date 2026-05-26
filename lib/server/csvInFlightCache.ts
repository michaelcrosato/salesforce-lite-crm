function normalizeCacheValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeCacheValue(item));
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, normalizeCacheValue(child)] as const);

    return Object.fromEntries(entries);
  }

  return value;
}

function cacheKeyForOptions(options: object): string {
  return JSON.stringify(normalizeCacheValue(options));
}

export function getInFlightCsvPacket<TPacket>(
  cache: Map<string, Promise<TPacket>>,
  options: object,
  load: () => Promise<TPacket>
): Promise<TPacket> {
  const key = cacheKeyForOptions(options);
  const existing = cache.get(key);

  if (existing !== undefined) {
    return existing;
  }

  const pending = load().finally(() => {
    setTimeout(() => {
      if (cache.get(key) === pending) {
        cache.delete(key);
      }
    }, 0);
  });

  cache.set(key, pending);

  return pending;
}
