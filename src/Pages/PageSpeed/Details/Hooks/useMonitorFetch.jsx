import { useEffect, useState } from "react";
import { networkService } from "../../../../main";
import { createToast } from "../../../../Utils/toastUtils";
import { useNavigate } from "react-router-dom";
const useMonitorFetch = ({ authToken, monitorId }) => {
	const navigate = useNavigate();

	const [monitor, setMonitor] = useState(undefined);
	const [audits, setAudits] = useState(undefined);
	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);
	useEffect(() => {
		const fetchMonitor = async () => {
			try {
				const res = await networkService.getStatsByMonitorId({
					authToken: authToken,
					monitorId: monitorId,
					sortOrder: "desc",
					limit: 50,
					dateRange: "day",
					numToDisplay: null,
					normalize: null,
				});
				setMonitor(res?.data?.data ?? undefined);
				setAudits(res?.data?.data?.checks?.[0]?.audits ?? undefined);
			} catch (error) {
				setNetworkError(true);
				createToast({ body: error.message });
			} finally {
				setIsLoading(false);
			}
		};

		fetchMonitor();
	}, [authToken, monitorId, navigate]);

	return { monitor, audits, isLoading };
};

export { useMonitorFetch };
