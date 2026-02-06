import type { Incident, IncidentSummaryItem } from "@/Types/Incident";
import prettyMilliseconds from "pretty-ms";

type IncidentLike = Pick<Incident, "startTime" | "endTime" | "status">;

export const getIncidentsDuration = (incident: IncidentLike | IncidentSummaryItem) => {
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

	return prettyMilliseconds(durationMs, {
		secondsDecimalDigits: 0,
		millisecondsDecimalDigits: 0,
	});
};
