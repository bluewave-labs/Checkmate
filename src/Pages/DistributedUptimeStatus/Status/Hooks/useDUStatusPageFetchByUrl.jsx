import { useState, useEffect } from "react";
import { networkService } from "../../../../main";
import { createToast } from "../../../../Utils/toastUtils";
import { useSelector } from "react-redux";
import { useTheme } from "@emotion/react";
import { useMonitorUtils } from "../../../../Hooks/useMonitorUtils";

const useDUStatusPageFetchByUrl = ({ url, timeFrame }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);
	const [statusPage, setStatusPage] = useState(undefined);
	const [monitorId, setMonitorId] = useState(undefined);
	const [isPublished, setIsPublished] = useState(false);
	const { authToken } = useSelector((state) => state.auth);
	const theme = useTheme();
	const { getMonitorWithPercentage } = useMonitorUtils();

	useEffect(() => {
		const fetchStatusPageByUrl = async () => {
			try {
				const response = await networkService.getDistributedStatusPageByUrl({
					authToken,
					url,
					type: "distributed",
					timeFrame,
				});
				if (!response?.data?.data) return;
				const statusPage = response.data.data;

				const monitorsWithPercentage = statusPage?.subMonitors.map((monitor) =>
					getMonitorWithPercentage(monitor, theme)
				);

				const statusPageWithSubmonitorPercentages = {
					...statusPage,
					subMonitors: monitorsWithPercentage,
				};
				setStatusPage(statusPageWithSubmonitorPercentages);

				setMonitorId(statusPage?.monitors[0]);
				setIsPublished(statusPage?.isPublished);
			} catch (error) {
				setNetworkError(true);
				createToast({
					body: error.message,
				});
			} finally {
				setIsLoading(false);
			}
		};
		fetchStatusPageByUrl();
	}, [authToken, url, getMonitorWithPercentage, theme, timeFrame]);

	return [isLoading, networkError, statusPage, monitorId, isPublished];
};

export { useDUStatusPageFetchByUrl };
