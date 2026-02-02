import { useEffect, useState } from "react";
import { networkService } from "../main.jsx";
import { createToast } from "../Utils/toastUtils.jsx";
import { useTranslation } from "react-i18next";

export const useFetchMonitorsByTeamId = ({ types, filter, updateTrigger }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [monitors, setMonitors] = useState(undefined);
	const [networkError, setNetworkError] = useState(false);

	useEffect(() => {
		const fetchMonitors = async () => {
			try {
				setIsLoading(true);
				const res = await networkService.getMonitorsByTeamId({
					types,
					filter,
				});
				if (res?.data?.data) {
					setMonitors(res.data.data);
				}
			} catch (error) {
				setNetworkError(true);
				createToast({
					body: error.message,
				});
			} finally {
				setIsLoading(false);
			}
		};
		fetchMonitors();
	}, [types, filter, updateTrigger]);
	return [monitors, isLoading, networkError];
};

export const useDeleteMonitor = () => {
	const [isLoading, setIsLoading] = useState(false);
	const { t } = useTranslation();
	const deleteMonitor = async (monitorId, successCallback = () => {}) => {
		try {
			setIsLoading(true);
			await networkService.deleteMonitorById({ monitorId });
			successCallback();
			createToast({ body: t("monitorDeleted") });
		} catch (error) {
			createToast({ body: t("failedDeleteMonitor") });
		} finally {
			setIsLoading(false);
		}
	};
	return [deleteMonitor, isLoading];
};

export const usePauseMonitor = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const { t } = useTranslation();

	const pauseMonitor = async (monitorId, successCallback = () => {}) => {
		try {
			setIsLoading(true);
			const res = await networkService.pauseMonitorById({ monitorId });
			successCallback();
			if (res.data.data.isActive === false) {
				createToast({ body: t("monitorPaused") });
			} else {
				createToast({ body: t("monitorResumed") });
			}
		} catch (error) {
			setError(error.message);
			createToast({ body: t("failedPauseMonitor") });
		} finally {
			setIsLoading(false);
		}
	};

	return [pauseMonitor, isLoading, error];
};

export const useAddDemoMonitors = () => {
	const [isLoading, setIsLoading] = useState(false);
	const { t } = useTranslation();
	const addDemoMonitors = async () => {
		try {
			setIsLoading(true);
			await networkService.addDemoMonitors();
			createToast({ body: t("monitorHooks.successAddDemoMonitors") });
		} catch (error) {
			createToast({ body: t("monitorHooks.failureAddDemoMonitors") });
		} finally {
			setIsLoading(false);
		}
	};
	return [addDemoMonitors, isLoading];
};

export const useDeleteAllMonitors = () => {
	const [isLoading, setIsLoading] = useState(false);
	const { t } = useTranslation();
	const deleteAllMonitors = async () => {
		try {
			setIsLoading(true);
			await networkService.deleteAllMonitors();
			createToast({ body: t("settingsMonitorsDeleted") });
		} catch (error) {
			createToast({ body: t("settingsFailedToDeleteMonitors") });
		} finally {
			setIsLoading(false);
		}
	};
	return [deleteAllMonitors, isLoading];
};

export const useDeleteMonitorStats = () => {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const deleteMonitorStats = async () => {
		setIsLoading(true);
		try {
			await networkService.deleteChecksByTeamId();
			createToast({ body: t("settingsStatsCleared") });
		} catch (error) {
			createToast({ body: t("settingsFailedToClearStats") });
		} finally {
			setIsLoading(false);
		}
	};

	return [deleteMonitorStats, isLoading];
};

export const useCreateBulkMonitors = () => {
	const [isLoading, setIsLoading] = useState(false);

	const createBulkMonitors = async (file, user) => {
		setIsLoading(true);

		const formData = new FormData();
		formData.append("csvFile", file);

		try {
			const response = await networkService.createBulkMonitors(formData);
			return [true, response.data, null];
		} catch (err) {
			const errorMessage = err?.response?.data?.msg || err.message;
			return [false, null, errorMessage];
		} finally {
			setIsLoading(false);
		}
	};

	return [createBulkMonitors, isLoading];
};

export const useFetchJson = () => {
	const [isLoading, setIsLoading] = useState(false);
	const fetchJson = async () => {
		try {
			setIsLoading(true);
			const res = await networkService.fetchJson();
			createToast({ body: "JSON fetched successfully" });
			return res?.data?.data ?? [];
		} catch (error) {
			createToast({ body: "Failed to create monitor." });
		} finally {
			setIsLoading(false);
		}
	};
	return [fetchJson, isLoading];
};
