import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { networkService } from "../../../../main";
import { useTranslation } from "react-i18next";
import { createToast } from "../../../../Utils/toastUtils";

const useMonitorFetch = ({ page, field, filter, rowsPerPage, updateTrigger }) => {
	// Redux state
	const { user } = useSelector((state) => state.auth);
	const { t } = useTranslation();

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
				});
				setMonitors(response?.data?.data?.filteredMonitors ?? []);
				setSummary(response?.data?.data?.summary ?? {});
			} catch (error) {
				setNetworkError(true);
				createToast({
					body: t("failedToFetchData"),
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchMonitors();
	}, [page, field, filter, rowsPerPage, user.teamId, updateTrigger]);

	return { monitors, summary, isLoading, networkError };
};

export { useMonitorFetch };
