import { useEffect, useState } from "react";
import { networkService } from "../main";
import { createToast } from "../Utils/toastUtils";

export const useFetchMonitorsWithSummary = ({ teamId, types, monitorUpdateTrigger }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [monitors, setMonitors] = useState(undefined);
	const [monitorsSummary, setMonitorsSummary] = useState(undefined);
	const [networkError, setNetworkError] = useState(false);

	useEffect(() => {
		const fetchMonitors = async () => {
			try {
				setIsLoading(true);
				const res = await networkService.getMonitorsWithSummaryByTeamId({
					teamId,
					types,
				});
				const { monitors, summary } = res?.data?.data ?? {};
				setMonitors(monitors);
				setMonitorsSummary(summary);
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
	}, [teamId, types, monitorUpdateTrigger]);
	return [monitors, monitorsSummary, isLoading, networkError];
};

export default useFetchMonitorsWithSummary;
