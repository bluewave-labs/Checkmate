import { useEffect, useState } from "react";
import { networkService } from "../../../../main";
import { createToast } from "../../../../Utils/toastUtils";
import { useTheme } from "@emotion/react";
import { useMonitorUtils } from "../../../../Hooks/useMonitorUtils";

export const useMonitorFetch = ({
	authToken,
	teamId,
	limit,
	page,
	rowsPerPage,
	filter,
	field,
	order,
	triggerUpdate,
}) => {
	const [monitorsAreLoading, setMonitorsAreLoading] = useState(false);
	const [monitors, setMonitors] = useState(undefined);
	const [filteredMonitors, setFilteredMonitors] = useState(undefined);
	const [monitorsSummary, setMonitorsSummary] = useState(undefined);
	const [networkError, setNetworkError] = useState(false);

	const theme = useTheme();
	const { getMonitorWithPercentage } = useMonitorUtils();
	useEffect(() => {
		const fetchMonitors = async () => {
			try {
				setMonitorsAreLoading(true);
				const res = await networkService.getMonitorsByTeamId({
					authToken,
					teamId,
					limit,
					types: ["http", "ping", "docker", "port"],
					page,
					rowsPerPage,
					filter,
					field,
					order,
				});
				const { monitors, filteredMonitors, summary } = res.data.data;
				const mappedMonitors = filteredMonitors.map((monitor) =>
					getMonitorWithPercentage(monitor, theme)
				);
				setMonitors(monitors);
				setFilteredMonitors(mappedMonitors);
				setMonitorsSummary(summary);
			} catch (error) {
				setNetworkError(true);
				createToast({
					body: error.message,
				});
			} finally {
				setMonitorsAreLoading(false);
			}
		};
		fetchMonitors();
	}, [
		authToken,
		teamId,
		limit,
		field,
		filter,
		order,
		page,
		rowsPerPage,
		theme,
		triggerUpdate,
	]);
	return {
		monitors,
		filteredMonitors,
		monitorsSummary,
		monitorsAreLoading,
		networkError,
	};
};

export default useMonitorFetch;
