import { useEffect, useState } from "react";
import { networkService } from "../main";
import { useNavigate } from "react-router-dom";
import { createToast } from "../Utils/toastUtils";
import { useSelector } from "react-redux";

export const useFetchUptimeMonitorDetails = ({ monitorId, dateRange }) => {
	const [networkError, setNetworkError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [monitor, setMonitor] = useState(undefined);
	const [monitorStats, setMonitorStats] = useState(undefined);
	const navigate = useNavigate();

	// Get monitor's isActive status from Redux store
	const [monitorIsActive, setMonitorIsActive] = useState(
		useSelector((state) => state.uptimeMonitors[monitorId]?.isActive)
	);

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
	}, [dateRange, monitorId, monitorIsActive, navigate]);
	return [monitor, monitorStats, isLoading, networkError, setMonitorIsActive];
};

export default useFetchUptimeMonitorDetails;
