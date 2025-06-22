import { useEffect, useState } from "react";
import { networkService } from "../../../../main";
import { useSelector } from "react-redux";
import { createToast } from "../../../../Utils/toastUtils";

const useMonitorsFetch = () => {
	const { user } = useSelector((state) => state.auth);

	const [monitors, setMonitors] = useState(undefined);
	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);
	useEffect(() => {
		const fetchMonitors = async () => {
			try {
				const response = await networkService.getMonitorsByTeamId({
					limit: null, // donot return any checks for the monitors
					types: ["http", "ping", "port"], // status page is available for uptime, ping, and port monitors
				});
				setMonitors(response.data.data.monitors);
			} catch (error) {
				setNetworkError(true);
				createToast({ body: error.message });
			} finally {
				setIsLoading(false);
			}
		};
		fetchMonitors();
	}, [user]);

	return [monitors, isLoading, networkError];
};

export { useMonitorsFetch };
