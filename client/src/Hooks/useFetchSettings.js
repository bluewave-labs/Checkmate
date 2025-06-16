import { useState, useEffect } from "react";
import { networkService } from "../main";
import { createToast } from "../Utils/toastUtils";
import { useTranslation } from "react-i18next";

// Hook to fetch settings on mount or on-demand (via setSettingsData)
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
	}, [setSettingsData]);

	return [isLoading, error];
};

// Hook to save settings
const useSaveSettings = (onSaveSuccess) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(undefined);
	const { t } = useTranslation();

	const saveSettings = async (settings) => {
		setIsLoading(true);
		try {
			const response = await networkService.updateAppSettings({ settings });
			if (settings.checkTTL) {
				await networkService.updateChecksTTL({ ttl: settings.checkTTL });
			}
			createToast({ body: t("settingsSuccessSaved") });
			if (onSaveSuccess) {
				onSaveSuccess();
			}

			return response?.data?.data; // return updated settings here
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
