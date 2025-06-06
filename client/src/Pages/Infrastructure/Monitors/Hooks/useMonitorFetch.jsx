import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { networkService } from "../../../../main";
import { createToast } from "../../../../Utils/toastUtils";

const useMonitorFetch = ({ page, field, filter, rowsPerPage, search, updateTrigger }) => {
	const { user } = useSelector((state) => state.auth);

	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);
	const [monitors, setMonitors] = useState([]); // changed here
	const [summary, setSummary] = useState({}); // and here

	useEffect(() => {
		const fetchMonitors = async () => {
			setIsLoading(true); // ensure loading shows for every update
			setNetworkError(false);

			try {
				const response = await networkService.getMonitorsByTeamId({
					teamId: user.teamId,
					limit: 1,
					field,
					filter,
					search,
					types: ["hardware"],
					page,
					rowsPerPage,
				});
				setMonitors(response?.data?.data?.filteredMonitors ?? []);
				setSummary(response?.data?.data?.summary ?? {});
			} catch (error) {
				setNetworkError(true);
				createToast({
					body: error.message,
				});
			} finally {
				setIsLoading(false);
			}
		};

		if (user?.teamId) {
			fetchMonitors();
		}
	}, [page, field, filter, search, rowsPerPage, user?.teamId, updateTrigger]);

	return { monitors, summary, isLoading, networkError };
};

export { useMonitorFetch };
