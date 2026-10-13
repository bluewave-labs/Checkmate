import type { RootState } from "@/store";
import { formatDate, type DateFormat } from "@/Utils/TimeUtils";
import { useCallback } from "react";
import { useSelector } from "react-redux";

export const useFormatDate = () => {
	const timeZone = useSelector((state: RootState) => state.ui.timezone);
	const timeFormat = useSelector((state: RootState) => state.ui.timeFormat);
	const locale = useSelector((state: RootState) => state.ui.language);
	return useCallback(
		(value: string | number | Date | null | undefined, format: DateFormat) =>
			formatDate(value, format, { timeZone, locale, timeFormat }),
		[timeZone, locale, timeFormat]
	);
};
