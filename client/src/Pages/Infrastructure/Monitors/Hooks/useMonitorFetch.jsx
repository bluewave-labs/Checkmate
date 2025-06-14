import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { networkService } from "../../../../main";
import { createToast } from "../../../../Utils/toastUtils";

const useMonitorFetch = ({ page, field, filter, rowsPerPage, updateTrigger, search }) => {
	// Redux state
	const { user } = useSelector((state) => state.auth);

	// Local state
	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);
	const [monitors, setMonitors] = useState(undefined);
	const [summary, setSummary] = useState(undefined);

	useEffect(() => {
		const fetchMonitors = async () => {
			try {
				const response = await networkService.getMonitorsByTeamId({
					teamId: user.teamId,
					limit: 1,
					field: field,
					filter: filter,
					types: ["hardware"],
					page: page,
					rowsPerPage: rowsPerPage,
					search: search
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

		fetchMonitors();
	}, [page, field, filter, rowsPerPage, user.teamId, updateTrigger, search]);

	return { monitors, summary, isLoading, networkError };
};

export { useMonitorFetch };
