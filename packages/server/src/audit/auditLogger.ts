import { appendFileSync } from "fs";
import { join } from "path";

const LOG_PATH = join(process.cwd(), "logs", "audit.jsonl");

export function auditLog(event: {
  type: "tool_use" | "message" | "auth" | "error";
  data: Record<string, unknown>;
}): void {
  const entry = JSON.stringify({ ts: new Date().toISOString(), ...event });
  try {
    appendFileSync(LOG_PATH, entry + "\n");
  } catch {
    // logs/ dir may not exist yet — silently skip rather than crashing
  }
}
