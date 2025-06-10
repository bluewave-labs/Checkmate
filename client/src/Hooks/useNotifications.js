import { useState, useEffect, useCallback } from "react";
import { createToast } from "../Utils/toastUtils";
import { networkService } from "../main";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

const useCreateNotification = () => {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);

	const createNotification = async (notification) => {
		try {
			setIsLoading(true);
			await networkService.createNotification({ notification });
			createToast({
				body: t("notifications.create.success"),
			});
			navigate("/notifications");
		} catch (error) {
			setError(error);
			createToast({
				body: t("notifications.create.failed"),
			});
		} finally {
			setIsLoading(false);
		}
	};

	return [createNotification, isLoading, error];
};

const useGetNotificationsByTeamId = (updateTrigger) => {
	const [notifications, setNotifications] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const { user } = useSelector((state) => state.auth);
	const { t } = useTranslation();

	const getNotifications = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await networkService.getNotificationsByTeamId({
				teamId: user.teamId,
			});
			setNotifications(response?.data?.data ?? []);
		} catch (error) {
			setError(error);
			createToast({
				body: t("notifications.fetch.failed"),
			});
		} finally {
			setIsLoading(false);
		}
	}, [user.teamId]);

	useEffect(() => {
		getNotifications();
	}, [getNotifications, updateTrigger]);

	return [notifications, isLoading, error];
};

const useDeleteNotification = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const { t } = useTranslation();

	const deleteNotification = async (id, triggerUpdate) => {
		try {
			setIsLoading(true);
			await networkService.deleteNotificationById({ id });
			createToast({
				body: t("notifications.delete.success"),
			});
			triggerUpdate();
		} catch (error) {
			setError(error);
			createToast({
				body: t("notifications.delete.failed"),
			});
		} finally {
			setIsLoading(false);
		}
	};

	return [deleteNotification, isLoading, error];
};
export { useCreateNotification, useGetNotificationsByTeamId, useDeleteNotification };
