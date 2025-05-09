import { useState, useEffect } from "react";
import { networkService } from "../../../main";
import { useTranslation } from "react-i18next";
import { createToast } from "../../../Utils/toastUtils";
const useMonitorsFetch = ({ teamId }) => {
	//Local state
	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);
	const { t } = useTranslation();

	const [monitors, setMonitors] = useState(undefined);

	useEffect(() => {
		const fetchMonitors = async () => {
			try {
				setIsLoading(true);
				const res = await networkService.getMonitorsByTeamId({
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
				if (res?.data?.data?.filteredMonitors?.length > 0) {
					const monitorLookup = res.data.data.filteredMonitors.reduce((acc, monitor) => {
						acc[monitor._id] = {
							_id: monitor._id,
							name: monitor.name,
							type: monitor.type
						};
						return acc;
					}, {});
					setMonitors(monitorLookup);
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
	return { isLoading, monitors, networkError };
};

export { useMonitorsFetch };
