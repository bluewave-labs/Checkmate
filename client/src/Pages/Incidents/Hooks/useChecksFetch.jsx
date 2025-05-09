import { useState, useEffect } from "react";
import { networkService } from "../../../main";
import { createToast } from "../../../Utils/toastUtils";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
const useChecksFetch = ({ selectedMonitor, selectedMonitorType, filter, dateRange, page, rowsPerPage }) => {
	//Redux
	const { user } = useSelector((state) => state.auth);
	const { t } = useTranslation();

	//Local
	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);
	const [checks, setChecks] = useState(undefined);
	const [checksCount, setChecksCount] = useState(undefined);

	useEffect(() => {
		const fetchChecks = async () => {
			try {
				setIsLoading(true);
				let res;

				if (selectedMonitor === "0") {
					res = await networkService.getChecksByTeam({
						status: false,
						teamId: user.teamId,
						sortOrder: "desc",
						limit: null,
						dateRange,
						filter: filter,
						page: page,
						rowsPerPage: rowsPerPage,
					});
				} else {
					res = await networkService.getChecksByMonitor({
						status: false,
						monitorId: selectedMonitor,
						type: selectedMonitorType,
						sortOrder: "desc",
						limit: null,
						dateRange,
						filter: filter,
						page,
						rowsPerPage,
					});
				}
				setChecks(res.data.data.checks);
				setChecksCount(res.data.data.checksCount);
			} catch (error) {
				setNetworkError(true);
				createToast({ body: t("failedToFetchData") });
			} finally {
				setIsLoading(false);
			}
		};
		fetchChecks();
	}, [user, dateRange, page, rowsPerPage, filter, selectedMonitor, selectedMonitorType]);
	return { isLoading, networkError, checks, checksCount };
};

export default useChecksFetch;
