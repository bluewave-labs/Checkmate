import { getHumanReadableDuration } from "@/Utils/timeUtilsLegacy.js";
const useGetIncidentsDuration = (incident, isActive) => {
	if (!incident?.startTime) {
		return "-";
	}
	const startTime = new Date(incident?.startTime);
	const endTime = isActive
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
export default useGetIncidentsDuration;
