import { useEffect, useState } from "react";
import { networkService } from "../../../../main";
import { useNavigate } from "react-router-dom";
import { createToast } from "../../../../Utils/toastUtils";

export const useMonitorFetch = ({ authToken, monitorId, dateRange }) => {
	const [networkError, setNetworkError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [monitor, setMonitor] = useState(undefined);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchMonitors = async () => {
			try {
				const res = await networkService.getUptimeDetailsById({
					authToken: authToken,
					monitorId: monitorId,
					dateRange: dateRange,
					normalize: true,
				});
				setMonitor(res?.data?.data ?? {});
			} catch (error) {
				setNetworkError(true);
				createToast({ body: error.message });
			} finally {
				setIsLoading(false);
			}
		};
		fetchMonitors();
	}, [authToken, dateRange, monitorId, navigate]);
	return [monitor, isLoading, networkError];
};

export default useMonitorFetch;
