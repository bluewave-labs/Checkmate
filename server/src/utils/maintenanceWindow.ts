import type { MaintenanceWindow } from "@/types/index.js";

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
