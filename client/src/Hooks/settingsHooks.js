import { useState, useEffect } from "react";
import { networkService } from "../main";
import { createToast } from "../Utils/toastUtils";
import { useTranslation } from "react-i18next";

const useFetchSettings = ({ setSettingsData, setIsApiKeySet, setIsEmailPasswordSet }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(undefined);
	useEffect(() => {
		const fetchSettings = async () => {
			setIsLoading(true);
			try {
				const response = await networkService.getAppSettings();
				setSettingsData(response?.data?.data);
				setIsApiKeySet(response?.data?.data?.pagespeedKeySet);
				setIsEmailPasswordSet(response?.data?.data?.emailPasswordSet);
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

const useSaveSettings = ({
	setSettingsData,
	setIsApiKeySet,
	setApiKeyHasBeenReset,
	setIsEmailPasswordSet,
	setEmailPasswordHasBeenReset,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(undefined);
	const { t } = useTranslation();

	const saveSettings = async (settings) => {
		setIsLoading(true);
		try {
			const settingsResponse = await networkService.updateAppSettings({ settings });
			if (settings.checkTTL) {
				await networkService.updateChecksTTL({
					ttl: settings.checkTTL,
				});
			}
			setIsApiKeySet(settingsResponse.data.data.pagespeedKeySet);
			setIsEmailPasswordSet(settingsResponse.data.data.emailPasswordSet);
			if (settingsResponse.data.data.pagespeedKeySet === true) {
				setApiKeyHasBeenReset(false);
			}
			if (settingsResponse.data.data.emailPasswordSet === true) {
				setEmailPasswordHasBeenReset(false);
			}
			setSettingsData(settingsResponse.data.data);
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
