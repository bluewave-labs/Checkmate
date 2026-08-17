import type { MaintenanceWindow } from "@/domain/maintenance-windows/maintenance-window.type.js";

export const isWindowActive = (window: MaintenanceWindow, now: Date = new Date()): boolean => {
	if (!window.active) {
		return false;
	}

	const start = new Date(window.start);
	const end = new Date(window.end);
	const repeatInterval = window.repeat || 0;

	if (start <= now && end >= now) {
		return true;
	}

	// For a recurring window whose first occurrence is in the past,
	// advance start/end by the repeat interval until we either catch
	// an occurrence covering `now` or move past it.
	while (start < now && repeatInterval !== 0) {
		start.setTime(start.getTime() + repeatInterval);
		end.setTime(end.getTime() + repeatInterval);
		if (start <= now && end >= now) {
			return true;
		}
	}

	return false;
};

export const getActiveWindowEnd = (window: MaintenanceWindow, now: Date = new Date()): Date | null => {
	if (!window.active) {
		return null;
	}

	const start = new Date(window.start);
	const end = new Date(window.end);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
		return null;
	}

	if (start <= now && end >= now) {
		return new Date(end);
	}

	const repeatInterval = window.repeat ?? 0;
	if (repeatInterval <= 0 || now < start) {
		return null;
	}

	const durationMs = end.getTime() - start.getTime();
	if (durationMs < 0) {
		return null;
	}

	const occurrencesPassed = Math.floor((now.getTime() - start.getTime()) / repeatInterval);
	const occurrenceStart = start.getTime() + occurrencesPassed * repeatInterval;
	const occurrenceEnd = occurrenceStart + durationMs;

	return occurrenceStart <= now.getTime() && occurrenceEnd >= now.getTime() ? new Date(occurrenceEnd) : null;
};
