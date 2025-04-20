import { useEffect, useState, useCallback } from "react";
import { networkService } from "../../../../main";
import { useSelector } from "react-redux";
import { createToast } from "../../../../Utils/toastUtils";
import { useTheme } from "@emotion/react";
import { useMonitorUtils } from "../../../../Hooks/useMonitorUtils";

const useStatusPageFetch = (isCreate = false, url) => {
	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);
	const [statusPage, setStatusPage] = useState(undefined);
	const [monitors, setMonitors] = useState(undefined);
	const theme = useTheme();
	const { getMonitorWithPercentage } = useMonitorUtils();
	const fetchStatusPage = useCallback(async () => {
		try {
			const response = await networkService.getStatusPageByUrl({
				url,
				type: "uptime",
			});
			if (!response?.data?.data) return;
			const { statusPage, monitors } = response.data.data;
			setStatusPage(statusPage);

			const monitorsWithPercentage = monitors.map((monitor) =>
				getMonitorWithPercentage(monitor, theme)
			);

			setMonitors(monitorsWithPercentage);
		} catch (error) {
			// If there is a 404, status page is not found
			if (error?.response?.status === 404) {
				setStatusPage(undefined);
				return;
			}
			createToast({ body: error.message });
			setNetworkError(true);
		} finally {
			setIsLoading(false);
		}
	}, [theme, getMonitorWithPercentage, url]);

	useEffect(() => {
		if (isCreate === true) {
			return;
		}
		fetchStatusPage();
	}, [isCreate, fetchStatusPage]);

	return [statusPage, monitors, isLoading, networkError, fetchStatusPage];
};

export { useStatusPageFetch };
