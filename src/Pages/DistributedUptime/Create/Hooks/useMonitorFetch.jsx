import { useEffect, useState } from "react";
import { networkService } from "../../../../main";
import { createToast } from "../../../../Utils/toastUtils";

export const useMonitorFetch = ({ monitorId, isCreate }) => {
	const [networkError, setNetworkError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [monitor, setMonitor] = useState(undefined);

	useEffect(() => {
		const fetchMonitors = async () => {
			try {
				if (isCreate) return;
				const res = await networkService.getUptimeDetailsById({
					monitorId: monitorId,
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
	}, [monitorId, isCreate]);
	return [monitor, isLoading, networkError];
};

export default useMonitorFetch;
