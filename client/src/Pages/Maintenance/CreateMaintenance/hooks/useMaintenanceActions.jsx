import { networkService } from "../../../../main";
import dayjs from "dayjs";
import {
	MS_PER_SECOND,
	MS_PER_MINUTE,
	MS_PER_HOUR,
	MS_PER_DAY,
	MS_PER_WEEK,
} from "../../../../Utils/timeUtils";

const useMaintenanceActions = () => {
	const MS_LOOKUP = {
		seconds: MS_PER_SECOND,
		minutes: MS_PER_MINUTE,
		hours: MS_PER_HOUR,
		days: MS_PER_DAY,
		weeks: MS_PER_WEEK,
	};
	const REPEAT_LOOKUP = {
		none: 0,
		daily: MS_PER_DAY,
		weekly: MS_PER_DAY * 7,
	};
	const handleSubmitForm = async (maintenanceWindowId, form) => {
		const start = dayjs(form.startDate)
			.set("hour", form.startTime.hour())
			.set("minute", form.startTime.minute());

		const MS_MULTIPLIER = MS_LOOKUP[form.durationUnit];
		const durationInMs = form.duration * MS_MULTIPLIER;
		const end = start.add(durationInMs);

		const repeat = REPEAT_LOOKUP[form.repeat];

		const submit = {
			monitors: form.monitors.map((monitor) => monitor._id),
			name: form.name,
			start: start.toISOString(),
			end: end.toISOString(),
			repeat,
		};

		if (repeat === 0) {
			submit.expiry = end;
		}

		const requestConfig = { maintenanceWindow: submit };

		if (maintenanceWindowId !== undefined) {
			requestConfig.maintenanceWindowId = maintenanceWindowId;
		}
		const request =
			maintenanceWindowId === undefined
				? networkService.createMaintenanceWindow(requestConfig)
				: networkService.editMaintenanceWindow(requestConfig);
		return request;
	};

	return {
		handleSubmitForm,
	};
};

export default useMaintenanceActions;
