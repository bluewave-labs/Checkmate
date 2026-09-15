import type { Monitor } from "@/Types/Monitor";

/**
 * `recentChecks` is oldest-first — the server appends each snapshot with
 * `$push … $slice: -N` — so the newest retained check is the last element.
 */
export const latestCheck = (monitor: Monitor) =>
	monitor.recentChecks?.[monitor.recentChecks.length - 1];
