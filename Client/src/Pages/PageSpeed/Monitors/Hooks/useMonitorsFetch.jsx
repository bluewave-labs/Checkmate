import { useEffect, useState } from "react";
import { networkService } from "../../../../main";
import { createToast } from "../../../../Utils/toastUtils";

const useMonitorsFetch = ({ authToken, teamId }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [monitors, setMonitors] = useState([]);
	const [summary, setSummary] = useState({});

	useEffect(() => {
		const fetchMonitors = async () => {
			try {
				setIsLoading(true);
				const res = await networkService.getMonitorsByTeamId({
					authToken: authToken,
					teamId: teamId,
					limit: 10,
					types: ["pagespeed"],
					page: null,
					rowsPerPage: null,
					filter: null,
					field: null,
					order: null,
				});
				if (res?.data?.data?.filteredMonitors) {
					setMonitors(res.data.data.filteredMonitors);
					setSummary(res.data.data.summary);
				}
			} catch (error) {
				createToast({
					body: error.message,
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchMonitors();
	}, [authToken, teamId]);
	return { isLoading, monitors, summary };
};

export default useMonitorsFetch;
