/**
 * Best-effort plain-language hint for common five-field cron expressions.
 * Used so the UI can explain when FX (stored with snapshots) refreshes.
 */
export function describeCronExpression(expr) {
  if (!expr || typeof expr !== "string") {
    return "the configured server snapshot schedule";
  }

  const parts = expr.trim().split(/\s+/);
  if (parts.length < 1) {
    return "the configured server snapshot schedule";
  }

  const minute = parts[0];
  const step = /^\*\/(\d+)$/.exec(minute);
  if (step) {
    const n = Number(step[1]);
    if (Number.isFinite(n) && n > 0) {
      if (n === 1) return "about every minute";
      if (n < 60) return `about every ${n} minutes`;
      if (n === 60) return "about every hour";
      return `about every ${n} minutes`;
    }
  }

  if (minute === "*") {
    return "every minute (per server cron)";
  }

  return "the configured server snapshot schedule";
}
