import { useState, useEffect } from "react";
import { networkService } from "../../../main";
import { createToast } from "../../../Utils/toastUtils";
const useMonitorsFetch = ({ authToken, teamId }) => {
	//Local state
	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);

	const [monitors, setMonitors] = useState(undefined);

	useEffect(() => {
		const fetchMonitors = async () => {
			try {
				setIsLoading(true);
				const res = await networkService.getMonitorsByTeamId({
					authToken,
					teamId,
					limit: null,
					types: null,
					status: null,
					checkOrder: null,
					normalize: null,
					page: null,
					rowsPerPage: null,
					filter: null,
					field: null,
					order: null,
				});
				if (res?.data?.data?.monitors?.length > 0) {
					const monitorLookup = res.data.data.monitors.reduce((acc, monitor) => {
						acc[monitor._id] = monitor;
						return acc;
					}, {});
					setMonitors(monitorLookup);
				}
			} catch (error) {
				setNetworkError(true);
				createToast({
					body: error.message,
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchMonitors();
	}, [authToken, teamId]);
	return { isLoading, monitors, networkError };
};

export { useMonitorsFetch };
