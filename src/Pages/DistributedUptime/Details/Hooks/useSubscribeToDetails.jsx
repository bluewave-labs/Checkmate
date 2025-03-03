import { useState, useEffect, useRef } from "react";
import { networkService } from "../../../../main";

const getRandomDevice = () => {
	const manufacturers = {
		Apple: ["iPhone 15 Pro Max", "iPhone 15", "iPhone 14 Pro", "iPhone 14", "iPhone 13"],
		Samsung: [
			"Galaxy S23 Ultra",
			"Galaxy S23+",
			"Galaxy S23",
			"Galaxy Z Fold5",
			"Galaxy Z Flip5",
		],
		Google: ["Pixel 8 Pro", "Pixel 8", "Pixel 7a", "Pixel 7", "Pixel 6a"],
		OnePlus: [
			"OnePlus 11",
			"OnePlus 10T",
			"OnePlus Nord 3",
			"OnePlus 10 Pro",
			"OnePlus Nord 2T",
		],
		Xiaomi: ["13 Pro", "13", "Redmi Note 12", "POCO F5", "Redmi 12"],
		Huawei: ["P60 Pro", "Mate X3", "Nova 11", "P50 Pro", "Mate 50"],
		Sony: ["Xperia 1 V", "Xperia 5 V", "Xperia 10 V", "Xperia Pro-I", "Xperia 1 IV"],
		Motorola: ["Edge 40 Pro", "Edge 40", "G84", "G54", "Razr 40 Ultra"],
		ASUS: [
			"ROG Phone 7",
			"Zenfone 10",
			"ROG Phone 6",
			"Zenfone 9",
			"ROG Phone 7 Ultimate",
		],
	};

	const manufacturerNames = Object.keys(manufacturers);
	const randomManufacturer =
		manufacturerNames[Math.floor(Math.random() * manufacturerNames.length)];

	const models = manufacturers[randomManufacturer];
	const randomModel = models[Math.floor(Math.random() * models.length)];

	return {
		manufacturer: randomManufacturer,
		model: randomModel,
	};
};
const useSubscribeToDetails = ({ monitorId, isPublic, isPublished, dateRange }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [connectionStatus, setConnectionStatus] = useState(undefined);
	const [retryCount, setRetryCount] = useState(0);
	const [networkError, setNetworkError] = useState(false);
	const [monitor, setMonitor] = useState(undefined);
	const [lastUpdateTrigger, setLastUpdateTrigger] = useState(0);
	const [devices, setDevices] = useState(Array.from({ length: 5 }, getRandomDevice));

	const prevDateRangeRef = useRef(dateRange);

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
					const latestChecksWithDevice = data?.monitor?.latestChecks.map((check, idx) => {
						check.device = devices[idx];
						return check;
					});
					const monitorWithDevice = {
						...data.monitor,
						latestChecks: latestChecksWithDevice,
					};
					setMonitor(monitorWithDevice);
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
		devices,
		isLoading,
		isPublic,
		isPublished,
	]);

	useEffect(() => {
		const hasDateRangeChanged = prevDateRangeRef.current !== dateRange;
		prevDateRangeRef.current = dateRange; // Update the ref to the current dateRange

		if (!hasDateRangeChanged) {
			setDevices(Array.from({ length: 5 }, getRandomDevice));
		}
	}, [dateRange]);

	return [isLoading, networkError, connectionStatus, monitor, lastUpdateTrigger];
};

export { useSubscribeToDetails };
