import { useEffect, useState } from "react";
import { networkService } from "../main";
import { createToast } from "../Utils/toastUtils";
import { useTheme } from "@emotion/react";
import { useMonitorUtils } from "./useMonitorUtils";

export const useFetchMonitorsWithChecks = ({
	teamId,
	types,
	limit,
	page,
	rowsPerPage,
	filter,
	field,
	order,
	monitorUpdateTrigger,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [count, setCount] = useState(undefined);
	const [monitors, setMonitors] = useState(undefined);
	const [networkError, setNetworkError] = useState(false);

	const theme = useTheme();
	const { getMonitorWithPercentage } = useMonitorUtils();
	useEffect(() => {
		const fetchMonitors = async () => {
			try {
				setIsLoading(true);
				const res = await networkService.getMonitorsWithChecksByTeamId({
					teamId,
					limit,
					types,
					page,
					rowsPerPage,
					filter,
					field,
					order,
				});
				const { count, monitors } = res?.data?.data ?? {};
				const mappedMonitors = monitors.map((monitor) =>
					getMonitorWithPercentage(monitor, theme)
				);
				setMonitors(mappedMonitors);
				setCount(count?.monitorsCount ?? 0);
			} catch (error) {
				console.error(error);
				setNetworkError(true);
				createToast({
					body: error.message,
				});
			} finally {
				setIsLoading(false);
			}
		};
		fetchMonitors();
	}, [
		field,
		filter,
		getMonitorWithPercentage,
		limit,
		order,
		page,
		rowsPerPage,
		teamId,
		theme,
		types,
		monitorUpdateTrigger,
	]);
	return [monitors, count, isLoading, networkError];
};

export default useFetchMonitorsWithChecks;
