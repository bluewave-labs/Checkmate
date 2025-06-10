import { useEffect, useState } from "react";
import { networkService } from "../../../../main";

const useHardwareMonitorsFetch = ({ monitorId, dateRange }) => {
	// Abort early if creating monitor
	if (!monitorId) {
		return { monitor: undefined, isLoading: false, networkError: undefined };
	}
	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);
	const [monitor, setMonitor] = useState(undefined);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await networkService.getHardwareDetailsByMonitorId({
					monitorId: monitorId,
					dateRange: dateRange,
				});
				setMonitor(response.data.data);
			} catch (error) {
				setNetworkError(true);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, [monitorId, dateRange]);

	return {
		isLoading,
		networkError,
		monitor,
	};
};

export { useHardwareMonitorsFetch };
