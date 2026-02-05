import { useMemo } from "react";
import dayjs from "dayjs";
import {
	maintenanceWindowSchema,
	repeatOptions,
	type MaintenanceWindowFormData,
} from "@/Validation/maintenanceWindow";
import type { MaintenanceWindow } from "@/Types/MaintenanceWindow";

interface UseMaintenanceWindowFormOptions {
	data?: MaintenanceWindow | null;
}

const getRepeatId = (repeatMs: number): string => {
	const option = repeatOptions.find((opt) => opt.value === repeatMs);
	return option?.id ?? "none";
};

export const useMaintenanceWindowForm = ({
	data = null,
}: UseMaintenanceWindowFormOptions = {}) => {
	return useMemo(() => {
		let defaults: MaintenanceWindowFormData;

		if (data) {
			const startDate = dayjs(data.start);

			defaults = {
				name: data.name,
				repeat: getRepeatId(data.repeat),
				startDate: startDate.format("YYYY-MM-DD"),
				startTime: startDate.format("HH:mm"),
				duration: data.duration ?? 0,
				durationUnit: data.durationUnit ?? "minutes",
				monitors: [data.monitorId],
			};
		} else {
			const now = dayjs();
			defaults = {
				name: "",
				repeat: "none",
				startDate: now.format("YYYY-MM-DD"),
				startTime: now.format("HH:mm"),
				duration: 0,
				durationUnit: "minutes",
				monitors: [],
			};
		}

		return { schema: maintenanceWindowSchema, defaults };
	}, [data]);
};
