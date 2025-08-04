import { useState, useEffect } from "react";
import { networkService } from "../main";
import { createToast } from "../Utils/toastUtils";
import { useTranslation } from "react-i18next";

const useResolveIncident = () => {
	const [isLoading, setIsLoading] = useState(false);
	const { t } = useTranslation();

	const resolveIncident = async (checkId, setUpdateTrigger) => {
		try {
			setIsLoading(true);
			await networkService.updateCheckStatus({
				checkId,
				ack: true,
			});
			setUpdateTrigger((prev) => !prev);
		} catch (error) {
			createToast({ body: t("checkHooks.failureResolveOne") });
		} finally {
			setIsLoading(false);
		}
	};

	return [resolveIncident, isLoading];
};

const useAcknowledgeChecks = () => {
	const [isLoading, setIsLoading] = useState(false);
	const { t } = useTranslation();

	const acknowledge = async (setUpdateTrigger, monitorId = null) => {
		setIsLoading(true);
		try {
			if (monitorId) {
				await networkService.updateMonitorChecksStatus({ monitorId, ack: true });
			} else {
				await networkService.updateAllChecksStatus({ ack: true });
			}
			setUpdateTrigger((prev) => !prev);
		} catch (error) {
			const toastMessage = monitorId
				? t("checkHooks.failureResolveMonitor")
				: t("checkHooks.failureResolveAll");
			createToast({ body: toastMessage });
		} finally {
			setIsLoading(false);
		}
	};

	return { acknowledge, isLoading };
};

export { useResolveIncident, useAcknowledgeChecks };
