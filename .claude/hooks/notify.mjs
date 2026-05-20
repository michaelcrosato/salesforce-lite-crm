#!/usr/bin/env node
import { readInput, logEvent, emitAllow } from "./_lib.mjs";

const input = await readInput();
logEvent("Notification", {
  message: String(input.message || "").slice(0, 500),
  notification_type: input.notification_type || "info",
  title: input.title || ""
});
emitAllow();
