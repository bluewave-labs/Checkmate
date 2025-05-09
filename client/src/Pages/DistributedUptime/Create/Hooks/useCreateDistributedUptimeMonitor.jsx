import { useState } from "react";
import { networkService } from "../../../../main";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { createToast } from "../../../../Utils/toastUtils";

const useCreateDistributedUptimeMonitor = ({ isCreate, monitorId }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [networkError, setNetworkError] = useState(false);
	const { t } = useTranslation();
	const createDistributedUptimeMonitor = async ({ form }) => {
		setIsLoading(true);
		try {
			if (isCreate) {
				await networkService.createMonitor({ monitor: form });
			} else {
				await networkService.updateMonitor({ monitor: form, monitorId });
			}

			return true;
		} catch (error) {
			setNetworkError(true);
			createToast({ body: error?.response?.data?.msg ?? t("failedToCreateMonitor") });
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	return [createDistributedUptimeMonitor, isLoading, networkError];
};

export { useCreateDistributedUptimeMonitor };
