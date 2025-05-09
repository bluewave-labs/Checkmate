import { useEffect, useState } from "react";
import { networkService } from "../../../../main";
import { useTranslation } from "react-i18next";
import { createToast } from "../../../../Utils/toastUtils";
import { useNavigate } from "react-router-dom";
const useMonitorFetch = ({ monitorId }) => {
	const navigate = useNavigate();
	const { t } = useTranslation();

	const [monitor, setMonitor] = useState(undefined);
	const [audits, setAudits] = useState(undefined);
	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);
	useEffect(() => {
		const fetchMonitor = async () => {
			try {
				const res = await networkService.getStatsByMonitorId({
					monitorId: monitorId,
					sortOrder: "desc",
					limit: 50,
					dateRange: "day",
					numToDisplay: null,
					normalize: null,
				});
				setMonitor(res?.data?.data ?? undefined);
				setAudits(res?.data?.data?.checks?.[0]?.audits ?? undefined);
			} catch (error) {
				setNetworkError(true);
				createToast({ body: t("failedToFetchData") });
			} finally {
				setIsLoading(false);
			}
		};

		fetchMonitor();
	}, [monitorId, navigate]);

	return { monitor, audits, isLoading };
};

export { useMonitorFetch };
