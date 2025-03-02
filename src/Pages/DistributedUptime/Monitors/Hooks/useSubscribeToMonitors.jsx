import { useEffect, useState } from "react";
import { networkService } from "../../../../main";
import { useSelector } from "react-redux";
import { useTheme } from "@emotion/react";
import { useMonitorUtils } from "../../../../Hooks/useMonitorUtils";
import { createToast } from "../../../../Utils/toastUtils";

const useSubscribeToMonitors = (page, rowsPerPage) => {
	// Redux
	const { user } = useSelector((state) => state.auth);

	// Local state
	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);
	const [monitors, setMonitors] = useState(undefined);
	const [monitorsSummary, setMonitorsSummary] = useState(undefined);
	const [filteredMonitors, setFilteredMonitors] = useState(undefined);

	const theme = useTheme();
	const { getMonitorWithPercentage } = useMonitorUtils();

	useEffect(() => {
		try {
			const cleanup = networkService.subscribeToDistributedUptimeMonitors({
				teamId: user.teamId,
				limit: 25,
				types: [
					typeof import.meta.env.VITE_DEPIN_TESTING === "undefined"
						? "distributed_http"
						: "distributed_test",
				],
				page,
				rowsPerPage,
				filter: null,
				field: null,
				order: null,
				onUpdate: (data) => {
					if (isLoading === true) {
						setIsLoading(false);
					}

					const res = data.monitors;
					const { monitors, filteredMonitors, summary } = res;
					const mappedMonitors = filteredMonitors.map((monitor) =>
						getMonitorWithPercentage(monitor, theme)
					);
					setMonitors(monitors);
					setMonitorsSummary(summary);
					setFilteredMonitors(mappedMonitors);
				},
				onError: () => {
					setIsLoading(false);
				},
			});

			return cleanup;
		} catch (error) {
			createToast({
				body: error.message,
			});
			setNetworkError(true);
		}
	}, [user, getMonitorWithPercentage, theme, isLoading, page, rowsPerPage]);
	return [isLoading, networkError, monitors, monitorsSummary, filteredMonitors];
};
export { useSubscribeToMonitors };
