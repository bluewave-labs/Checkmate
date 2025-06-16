import { useState, useEffect } from "react";
import { networkService } from "../main";
import { createToast } from "../Utils/toastUtils";
import { useTranslation } from "react-i18next";

// Hook to fetch settings on mount or on-demand (via setSettingsData)
const useFetchSettings = ({ setSettingsData }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(undefined);
	const { t } = useTranslation();

	const fetchSettings = async () => {
		setIsLoading(true);
		try {
			const response = await networkService.getAppSettings();
			if (response?.data?.data) {
				// Set the complete settings object
				setSettingsData({
					...response.data.data,
					settings: response.data.data.settings || {},
				});
			}
		} catch (error) {
			createToast({ body: t("settingsFailedToFetch") });
			setError(error);
		} finally {
			setIsLoading(false);
		}
	};

	// Fetch settings on mount
	useEffect(() => {
		fetchSettings();
	}, [setSettingsData]);

	return [isLoading, error, fetchSettings];
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
			return response?.data?.data;
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
