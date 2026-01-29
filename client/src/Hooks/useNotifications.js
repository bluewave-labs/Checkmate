import { useState, useEffect, useCallback } from "react";
import { createToast } from "../Utils/toastUtils.jsx";
import { networkService } from "../main.jsx";
import { useTranslation } from "react-i18next";

const useGetNotificationsByTeamId = (updateTrigger) => {
	const [notifications, setNotifications] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const { t } = useTranslation();

	const getNotifications = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await networkService.getNotificationsByTeamId();
			setNotifications(response?.data?.data ?? []);
		} catch (error) {
			setError(error);
			createToast({
				body: t("notifications.fetch.failed"),
			});
		} finally {
			setIsLoading(false);
		}
	}, [t]);

	useEffect(() => {
		getNotifications();
	}, [getNotifications, updateTrigger]);

	return [notifications, isLoading, error];
};

const useTestAllNotifications = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(undefined);
	const { t } = useTranslation();
	const testAllNotifications = async ({ monitorId }) => {
		try {
			setIsLoading(true);
			await networkService.testAllNotifications({ monitorId });
			createToast({
				body: t("notifications.test.success"),
			});
		} catch (error) {
			createToast({
				body: error.response?.data?.msg || error.message,
			});
			setError(error);
		} finally {
			setIsLoading(false);
		}
	};

	return [testAllNotifications, isLoading, error];
};

export { useGetNotificationsByTeamId, useTestAllNotifications };
