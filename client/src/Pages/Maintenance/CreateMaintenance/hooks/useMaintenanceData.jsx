import { networkService } from "../../../../main.jsx";
import dayjs from "dayjs";
import {
	MS_PER_SECOND,
	MS_PER_MINUTE,
	MS_PER_HOUR,
	MS_PER_DAY,
	MS_PER_WEEK,
} from "../../../../Utils/timeUtilsLegacy.js";
const useMaintenanceData = () => {
	const REVERSE_REPEAT_LOOKUP = {
		0: "none",
		[MS_PER_DAY]: "daily",
		[MS_PER_WEEK]: "weekly",
	};
	const getDurationAndUnit = (durationInMs) => {
		if (durationInMs % MS_PER_DAY === 0) {
			return {
				duration: (durationInMs / MS_PER_DAY).toString(),
				durationUnit: "days",
			};
		} else if (durationInMs % MS_PER_HOUR === 0) {
			return {
				duration: (durationInMs / MS_PER_HOUR).toString(),
				durationUnit: "hours",
			};
		} else if (durationInMs % MS_PER_MINUTE === 0) {
			return {
				duration: (durationInMs / MS_PER_MINUTE).toString(),
				durationUnit: "minutes",
			};
		} else {
			return {
				duration: (durationInMs / MS_PER_SECOND).toString(),
				durationUnit: "seconds",
			};
		}
	};
	const fetchMonitorsMaintenance = async () => {
		const response = await networkService.getMonitorsByTeamId({
			limit: null,
			types: ["http", "ping", "pagespeed", "port"],
		});
		const fetchedMonitors = response.data.data;
		return fetchedMonitors;
	};

	const initializeMaintenanceForEdit = async (maintenanceWindowId, monitorList) => {
		const res = await networkService.getMaintenanceWindowById({
			maintenanceWindowId: maintenanceWindowId,
		});
		const maintenanceWindow = res.data.data;
		const { name, start, end, repeat, monitorId } = maintenanceWindow;
		const startTime = dayjs(start);
		const endTime = dayjs(end);
		const durationInMs = endTime.diff(startTime, "milliseconds").toString();
		const { duration, durationUnit } = getDurationAndUnit(durationInMs);
		const monitor = monitorList.find(
			(monitor) => (monitor._id ?? monitor.id) === monitorId
		);
		const maintenanceWindowInformation = {
			name,
			repeat: REVERSE_REPEAT_LOOKUP[repeat],
			startDate: startTime,
			startTime,
			duration,
			durationUnit,
			monitors: monitor ? [monitor] : [],
		};
		return maintenanceWindowInformation;
	};

	return { fetchMonitorsMaintenance, initializeMaintenanceForEdit };
};

export default useMaintenanceData;
