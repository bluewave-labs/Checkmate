import { useState, useEffect } from "react";
import { networkService } from "../main";
import { createToast } from "../Utils/toastUtils";
import { useTranslation } from "react-i18next";

const useFetchSettings = ({ setSettingsData }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(undefined);
	useEffect(() => {
		const fetchSettings = async () => {
			setIsLoading(true);
			try {
				const response = await networkService.getAppSettings();
				setSettingsData(response?.data?.data);
			} catch (error) {
				createToast({ body: "Failed to fetch settings" });
				setError(error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchSettings();
	}, []);

	return [isLoading, error];
};

const useSaveSettings = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(undefined);
	const { t } = useTranslation();

	const saveSettings = async (settings) => {
		setIsLoading(true);
		try {
			await networkService.updateAppSettings({ settings });
			if (settings.checkTTL) {
				await networkService.updateChecksTTL({
					ttl: settings.checkTTL,
				});
			}
			createToast({ body: t("settingsSuccessSaved") });
		} catch (error) {
			createToast({ body: t("settingsFailedToSave") });

			setError(error);
		} finally {
			setIsLoading(false);
		}
	};

	return [isLoading, error, saveSettings];
};

export { useFetchSettings, useSaveSettings };
