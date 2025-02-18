import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { networkService } from "../../../../main";

const useHardwareMonitorsFetch = ({ monitorId, dateRange }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);
	const [monitor, setMonitor] = useState(undefined);

	const { authToken } = useSelector((state) => state.auth);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await networkService.getHardwareDetailsByMonitorId({
					authToken: authToken,
					monitorId: monitorId,
					dateRange: dateRange,
				});
				response.data.data;
				setMonitor(response.data.data);
			} catch (error) {
				setNetworkError(true);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, [monitorId, dateRange, authToken]);

	return {
		isLoading,
		networkError,
		monitor,
	};
};

export { useHardwareMonitorsFetch };
