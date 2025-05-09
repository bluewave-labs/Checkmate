import { useEffect, useState } from "react";
import { networkService } from "../../../../main";
import { useTranslation } from "react-i18next";
import { createToast } from "../../../../Utils/toastUtils";
import { useTheme } from "@emotion/react";
import { useMonitorUtils } from "../../../../Hooks/useMonitorUtils";

export const useMonitorFetch = ({
	teamId,
	limit,
	page,
	rowsPerPage,
	filter,
	field,
	order,
	triggerUpdate,
}) => {
	const [monitorsAreLoading, setMonitorsAreLoading] = useState(false);
	const [monitors, setMonitors] = useState(undefined);
	const [filteredMonitors, setFilteredMonitors] = useState(undefined);
	const [monitorsSummary, setMonitorsSummary] = useState(undefined);
	const [networkError, setNetworkError] = useState(false);

	const theme = useTheme();
	const { t } = useTranslation();
	const { getMonitorWithPercentage } = useMonitorUtils();
	useEffect(() => {
		const fetchMonitors = async () => {
			try {
				setMonitorsAreLoading(true);
				const res = await networkService.getMonitorsByTeamId({
					teamId,
					limit,
					types: ["http", "ping", "docker", "port"],
					page,
					rowsPerPage,
					filter,
					field,
					order,
				});
				const { monitors, filteredMonitors, summary } = res.data.data;
				const mappedMonitors = filteredMonitors.map((monitor) =>
					getMonitorWithPercentage(monitor, theme)
				);
				setMonitors(monitors);
				setFilteredMonitors(mappedMonitors);
				setMonitorsSummary(summary);
			} catch (error) {
				setNetworkError(true);
				createToast({
					body: t("failedToFetchData"),
				});
			} finally {
				setMonitorsAreLoading(false);
			}
		};
		fetchMonitors();
	}, [
		teamId,
		limit,
		field,
		filter,
		order,
		page,
		rowsPerPage,
		theme,
		triggerUpdate,
		getMonitorWithPercentage,
	]);
	return {
		monitors,
		filteredMonitors,
		monitorsSummary,
		monitorsAreLoading,
		networkError,
	};
};

export default useMonitorFetch;
