import { useEffect, useState } from "react";
import { networkService } from "../../../../main";
import { useTranslation } from "react-i18next";
import { createToast } from "../../../../Utils/toastUtils";

const useMonitorsFetch = ({ teamId }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [monitors, setMonitors] = useState([]);
	const [summary, setSummary] = useState({});
	const [networkError, setNetworkError] = useState(false);
	const { t } = useTranslation();

	useEffect(() => {
		const fetchMonitors = async () => {
			try {
				setIsLoading(true);
				const res = await networkService.getMonitorsByTeamId({
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
				setNetworkError(true);
				createToast({
					body: t("failedToFetchData"),
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchMonitors();
	}, [teamId]);
	return { isLoading, monitors, summary, networkError };
};

export default useMonitorsFetch;
