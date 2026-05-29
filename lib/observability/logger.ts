// Dependency-free structured logger. Each call emits one JSON line via the
// console, filtered by a numeric level read from process.env.LOG_LEVEL.
//
// Logging is a side-channel only: records go to the console, never into
// returned data, so deterministic outputs (e.g. the routing_event payload)
// are unaffected. The level threshold is resolved per call so tests can flip
// LOG_LEVEL at runtime; under NODE_ENV=test the default is "silent" and the
// ISO timestamp is omitted, keeping any asserted log snapshots stable.

export type LogLevel = "debug" | "info" | "warn" | "error";
type LevelThreshold = LogLevel | "silent";

const LEVEL_WEIGHT: Record<LevelThreshold, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: Number.POSITIVE_INFINITY
};

export type LogFields = Record<string, unknown>;

function isLevelThreshold(value: string): value is LevelThreshold {
  return value in LEVEL_WEIGHT;
}

function resolveThresholdWeight(): number {
  const configured = process.env.LOG_LEVEL?.toLowerCase();
  if (configured && isLevelThreshold(configured)) {
    return LEVEL_WEIGHT[configured];
  }
  return process.env.NODE_ENV === "test"
    ? LEVEL_WEIGHT.silent
    : LEVEL_WEIGHT.info;
}

const CONSOLE_FOR_LEVEL: Record<LogLevel, (line: string) => void> = {
  debug: (line) => console.debug(line),
  info: (line) => console.info(line),
  warn: (line) => console.warn(line),
  error: (line) => console.error(line)
};

function emit(level: LogLevel, event: string, fields?: LogFields): void {
  if (LEVEL_WEIGHT[level] < resolveThresholdWeight()) {
    return;
  }
  const record: LogFields = { level, event, ...fields };
  if (process.env.NODE_ENV !== "test") {
    record.time = new Date().toISOString();
  }
  CONSOLE_FOR_LEVEL[level](JSON.stringify(record));
}

export const logger = {
  debug: (event: string, fields?: LogFields) => emit("debug", event, fields),
  info: (event: string, fields?: LogFields) => emit("info", event, fields),
  warn: (event: string, fields?: LogFields) => emit("warn", event, fields),
  error: (event: string, fields?: LogFields) => emit("error", event, fields)
};
