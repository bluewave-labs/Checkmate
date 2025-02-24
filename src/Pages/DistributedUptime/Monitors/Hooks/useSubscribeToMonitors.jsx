import { useEffect, useState } from "react";
import { networkService } from "../../../../main";
import { useSelector } from "react-redux";
import { useTheme } from "@emotion/react";
import { useMonitorUtils } from "../../../../Hooks/useMonitorUtils";
import { createToast } from "../../../../Utils/toastUtils";

const useSubscribeToMonitors = () => {
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
				types: ["distributed_http"],
				page: 0,
				rowsPerPage: 10,
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
	}, [user, getMonitorWithPercentage, theme, isLoading]);
	return [isLoading, networkError, monitors, monitorsSummary, filteredMonitors];
};
export { useSubscribeToMonitors };
