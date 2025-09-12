import { useEffect, useState } from "react";
import { networkService } from "../../../../main";
import { DATE_RANGES, API_CONFIG } from "../../../../Utils/statusPageConstants";

/**
 * Hook to fetch grouped response time data for a specific monitor
 * Uses the same API as uptime details page with normalize=true
 */
const useMonitorResponseTimeData = ({
	monitorId,
	dateRange = DATE_RANGES.RECENT,
	enabled = false,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [groupedChecks, setGroupedChecks] = useState([]);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!enabled || !monitorId) {
			setGroupedChecks([]);
			return;
		}

		const fetchResponseTimeData = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const res = await networkService.getUptimeDetailsById({
					monitorId: monitorId,
					dateRange: dateRange,
					normalize: API_CONFIG.NORMALIZE_RESPONSE,
				});

				const { monitorData } = res?.data?.data ?? {};
				setGroupedChecks(monitorData?.groupedChecks || []);
			} catch (error) {
				console.error("Error fetching response time data:", error);
				setError(error);
				setGroupedChecks([]);
			} finally {
				setIsLoading(false);
			}
		};

		fetchResponseTimeData();
	}, [monitorId, dateRange, enabled]);

	return { groupedChecks, isLoading, error };
};

export { useMonitorResponseTimeData };
