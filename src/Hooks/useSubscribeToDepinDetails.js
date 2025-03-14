import { useState, useEffect } from "react";
import { networkService } from "../main";
import { createToast } from "../Utils/toastUtils";

const useSubscribeToDepinDetails = ({ monitorId, isPublic, isPublished, dateRange }) => {
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

		// Get initial data

		const fetchInitialData = async () => {
			try {
				const res = await networkService.getDistributedUptimeDetails({
					monitorId,
					dateRange: dateRange,
					normalize: true,
				});
				const responseData = res?.data?.data;

				if (typeof responseData === "undefined") {
					throw new Error("No data");
				}
				setConnectionStatus("up");
				setLastUpdateTrigger(Date.now());
				setMonitor(responseData);
			} catch (error) {
				setNetworkError(true);
				setConnectionStatus("down");
				createToast({
					body: error.message,
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchInitialData();

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

export { useSubscribeToDepinDetails };
