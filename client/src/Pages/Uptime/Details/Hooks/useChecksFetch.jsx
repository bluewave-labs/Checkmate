import { useState } from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { networkService } from "../../../../main";
import { createToast } from "../../../../Utils/toastUtils";
export const useChecksFetch = ({
	monitorId,
	monitorType,
	dateRange,
	page,
	rowsPerPage,
}) => {
	const { t } = useTranslation();
	const [checks, setChecks] = useState(undefined);
	const [checksCount, setChecksCount] = useState(undefined);
	const [isLoading, setIsLoading] = useState(false);
	const [networkError, setNetworkError] = useState(false);

	useEffect(() => {
		if (!monitorType) {
			return;
		}

		const fetchChecks = async () => {
			try {
				setIsLoading(true);
				const res = await networkService.getChecksByMonitor({
					monitorId: monitorId,
					type: monitorType,
					sortOrder: "desc",
					limit: null,
					dateRange: dateRange,
					filter: null,
					page: page,
					rowsPerPage: rowsPerPage,
				});
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
	}, [monitorId, monitorType, dateRange, page, rowsPerPage]);

	return [checks, checksCount, isLoading, networkError];
};

export default useChecksFetch;
