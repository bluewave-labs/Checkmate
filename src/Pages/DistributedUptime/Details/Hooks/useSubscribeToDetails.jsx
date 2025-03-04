import { useState, useEffect } from "react";
import { networkService } from "../../../../main";

const useSubscribeToDetails = ({ monitorId, isPublic, isPublished, dateRange }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [connectionStatus, setConnectionStatus] = useState(undefined);
	const [retryCount, setRetryCount] = useState(0);
	const [networkError, setNetworkError] = useState(false);
	const [monitor, setMonitor] = useState(undefined);
	const [lastUpdateTrigger, setLastUpdateTrigger] = useState(0);

	useEffect(() => {
		if (typeof monitorId === "undefined") {
			return;
		}
		// If this page is public and not published, don't subscribe to details
		if (isPublic && isPublished === false) {
			return;
		}

		try {
			const cleanup = networkService.subscribeToDistributedUptimeDetails({
				monitorId,
				dateRange: dateRange,
				normalize: true,
				onUpdate: (data) => {
					if (isLoading === true) {
						setIsLoading(false);
					}
					if (networkError === true) {
						setNetworkError(false);
					}
					setLastUpdateTrigger(Date.now());
					setMonitor(data.monitor);
				},
				onOpen: () => {
					setConnectionStatus("up");
					setRetryCount(0); // Reset retry count on successful connection
				},
				onError: () => {
					setIsLoading(false);
					setNetworkError(true);
					setConnectionStatus("down");
				},
			});
			return cleanup;
		} catch (error) {
			setNetworkError(true);
		}
	}, [
		dateRange,
		monitorId,
		retryCount,
		setConnectionStatus,
		networkError,
		isLoading,
		isPublic,
		isPublished,
	]);

	return [isLoading, networkError, connectionStatus, monitor, lastUpdateTrigger];
};

export { useSubscribeToDetails };
