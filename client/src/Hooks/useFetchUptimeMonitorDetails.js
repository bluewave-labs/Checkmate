import { useEffect, useState } from "react";
import { networkService } from "../main";
import { useNavigate } from "react-router-dom";
import { createToast } from "../Utils/toastUtils";

export const useFetchUptimeMonitorDetails = ({ monitorId, dateRange }) => {
	const [networkError, setNetworkError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [monitor, setMonitor] = useState(undefined);
	const [monitorStats, setMonitorStats] = useState(undefined);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchMonitors = async () => {
			try {
				const res = await networkService.getUptimeDetailsById({
					monitorId: monitorId,
					dateRange: dateRange,
					normalize: true,
				});
				const { monitorData, monitorStats } = res?.data?.data ?? {};
				setMonitor(monitorData);
				setMonitorStats(monitorStats);
			} catch (error) {
				setNetworkError(true);
				createToast({ body: error.message });
			} finally {
				setIsLoading(false);
			}
		};
		fetchMonitors();
	}, [dateRange, monitorId, navigate]);
	return [monitor, monitorStats, isLoading, networkError];
};

export default useFetchUptimeMonitorDetails;
