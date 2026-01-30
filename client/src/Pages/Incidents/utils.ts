import type { Incident } from "@/Types/Incident";
import { getHumanReadableDuration } from "@/Utils/timeUtilsLegacy.js";
export const getIncidentsDuration = (incident: Incident) => {
	if (!incident?.startTime) {
		return "-";
	}
	const startTime = new Date(incident?.startTime);
	const endTime = incident.status
		? new Date()
		: incident?.endTime
			? new Date(incident.endTime)
			: null;

	if (!endTime) {
		return "-";
	}

	const durationMs = endTime.getTime() - startTime.getTime();

	if (durationMs < 0) {
		return "-";
	}

	return getHumanReadableDuration(durationMs);
};
