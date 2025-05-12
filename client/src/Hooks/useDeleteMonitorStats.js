import { useState } from "react";
import { networkService } from "../main";
import { createToast } from "../Utils/toastUtils";
import { useTranslation } from "react-i18next";

const UseDeleteMonitorStats = () => {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const deleteMonitorStats = async ({ teamId }) => {
		setIsLoading(true);
		try {
			const res = await networkService.deleteChecksByTeamId({ teamId });
			createToast({ body: t("settingsStatsCleared") });
		} catch (error) {
			createToast({ body: t("settingsFailedToClearStats") });
		} finally {
			setIsLoading(false);
		}
	};

	return [deleteMonitorStats, isLoading];
};

export { UseDeleteMonitorStats };
