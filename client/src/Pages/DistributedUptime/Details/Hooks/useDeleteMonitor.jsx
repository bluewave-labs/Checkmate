import { useState } from "react";
import { networkService } from "../../../../main";
import { useTranslation } from "react-i18next";
import { createToast } from "../../../../Utils/toastUtils";

const useDeleteMonitor = ({ monitorId }) => {
	const [isLoading, setIsLoading] = useState(false);
	const { t } = useTranslation();
	const deleteMonitor = async () => {
		try {
			setIsLoading(true);
			await networkService.deleteMonitorById({ monitorId });
			return true;
		} catch (error) {
			createToast({
				body: t("failedToDeleteMonitor"),
			});
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	return [deleteMonitor, isLoading];
};

export { useDeleteMonitor };
