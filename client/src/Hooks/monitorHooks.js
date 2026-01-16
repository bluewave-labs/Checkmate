import { useEffect, useState } from "react";
import { networkService } from "../main.jsx";
import { createToast } from "../Utils/toastUtils.jsx";
import { useTheme } from "@emotion/react";
import { useMonitorUtils } from "./useMonitorUtils.js";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const useFetchMonitorsWithSummary = ({ types, monitorUpdateTrigger }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [monitors, setMonitors] = useState(undefined);
	const [monitorsSummary, setMonitorsSummary] = useState(undefined);
	const [networkError, setNetworkError] = useState(false);

	useEffect(() => {
		const fetchMonitors = async () => {
			try {
				setIsLoading(true);
				const res = await networkService.getMonitorsWithSummaryByTeamId({
					types,
				});
				const { monitors, summary } = res?.data?.data ?? {};
				setMonitors(monitors);
				setMonitorsSummary(summary);
			} catch (error) {
				console.error(error);
				setNetworkError(true);
				createToast({
					body: error.message,
				});
			} finally {
				setIsLoading(false);
			}
		};
		fetchMonitors();
	}, [types, monitorUpdateTrigger]);
	return [monitors, monitorsSummary, isLoading, networkError];
};

export const useFetchMonitorsWithChecks = ({
	types,
	limit,
	page,
	rowsPerPage,
	filter,
	field,
	order,
	monitorUpdateTrigger,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [count, setCount] = useState(undefined);
	const [monitors, setMonitors] = useState(undefined);
	const [summary, setSummary] = useState(undefined);
	const [networkError, setNetworkError] = useState(false);

	const theme = useTheme();
	const { getMonitorWithPercentage } = useMonitorUtils();
	useEffect(() => {
		const fetchMonitors = async () => {
			try {
				setIsLoading(true);
				const res = await networkService.getMonitorsWithChecksByTeamId({
					limit,
					types,
					page,
					rowsPerPage,
					filter,
					field,
					order,
				});

				const { count, monitors, summary } = res?.data?.data ?? {};
				const mappedMonitors = monitors.map((monitor) =>
					getMonitorWithPercentage(monitor, theme)
				);
				setSummary(summary);
				setMonitors(mappedMonitors);
				setCount(count || 0);
			} catch (error) {
				console.error(error);
				setNetworkError(true);
				createToast({
					body: error.message,
				});
			} finally {
				setIsLoading(false);
			}
		};
		fetchMonitors();
	}, [
		field,
		filter,
		getMonitorWithPercentage,
		limit,
		order,
		page,
		rowsPerPage,
		theme,
		types,
		monitorUpdateTrigger,
	]);
	return [summary, monitors, count, isLoading, networkError];
};

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

export const useFetchStatsByMonitorId = ({
	monitorId,
	sortOrder,
	limit,
	dateRange,
	numToDisplay,
	normalize,
	updateTrigger,
}) => {
	const [monitor, setMonitor] = useState(undefined);
	const [audits, setAudits] = useState(undefined);
	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);
	useEffect(() => {
		const fetchMonitor = async () => {
			try {
				setIsLoading(true);
				const res = await networkService.getStatsByMonitorId({
					monitorId: monitorId,
					sortOrder,
					limit,
					dateRange,
					numToDisplay,
					normalize,
				});
				setMonitor(res?.data?.data ?? undefined);
				setAudits(res?.data?.data?.checks?.[0]?.audits ?? undefined);
			} catch (error) {
				setNetworkError(true);
				createToast({ body: error.message });
			} finally {
				setIsLoading(false);
			}
		};
		fetchMonitor();
	}, [monitorId, dateRange, numToDisplay, normalize, sortOrder, limit, updateTrigger]);
	return [monitor, audits, isLoading, networkError];
};

export const useFetchMonitorGames = ({ setGames, updateTrigger }) => {
	const [isLoading, setIsLoading] = useState(true);
	useEffect(() => {
		const fetchGames = async () => {
			try {
				setIsLoading(true);
				const res = await networkService.getMonitorGames();
				setGames(res.data.data);
			} catch (error) {
				createToast({ body: error.message });
			} finally {
				setIsLoading(false);
			}
		};
		fetchGames();
	}, [setGames, updateTrigger]);
	return [isLoading];
};

export const useFetchMonitorById = ({ monitorId, setMonitor, updateTrigger }) => {
	const [isLoading, setIsLoading] = useState(true);
	useEffect(() => {
		if (typeof monitorId === "undefined") {
			setIsLoading(false);
			return;
		}
		const fetchMonitor = async () => {
			try {
				setIsLoading(true);
				const res = await networkService.getMonitorById({ monitorId: monitorId });
				setMonitor(res.data.data);
			} catch (error) {
				createToast({ body: error.message });
			} finally {
				setIsLoading(false);
			}
		};
		fetchMonitor();
	}, [monitorId, setMonitor, updateTrigger]);
	return [isLoading];
};

export const useFetchHardwareMonitorById = ({ monitorId, dateRange, updateTrigger }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);
	const [monitor, setMonitor] = useState(undefined);

	useEffect(() => {
		const fetchMonitor = async () => {
			try {
				if (!monitorId) {
					return { monitor: undefined, isLoading: false, networkError: undefined };
				}
				const response = await networkService.getHardwareDetailsByMonitorId({
					monitorId: monitorId,
					dateRange: dateRange,
				});
				setMonitor(response.data.data);
			} catch (error) {
				setNetworkError(true);
			} finally {
				setIsLoading(false);
			}
		};
		fetchMonitor();
	}, [monitorId, dateRange, updateTrigger]);
	return [monitor, isLoading, networkError];
};
export const useFetchPageSpeedMonitorById = ({ monitorId, dateRange, updateTrigger }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);
	const [monitor, setMonitor] = useState(undefined);

	useEffect(() => {
		const fetchMonitor = async () => {
			try {
				if (!monitorId) {
					return { monitor: undefined, isLoading: false, networkError: undefined };
				}
				const response = await networkService.getPageSpeedDetailsByMonitorId({
					monitorId: monitorId,
					dateRange: dateRange,
				});
				setMonitor(response.data.data);
			} catch (error) {
				setNetworkError(true);
			} finally {
				setIsLoading(false);
			}
		};
		fetchMonitor();
	}, [monitorId, dateRange, updateTrigger]);
	return [monitor, isLoading, networkError];
};

export const useFetchUptimeMonitorById = ({ monitorId, dateRange, trigger }) => {
	const [networkError, setNetworkError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [monitor, setMonitor] = useState(undefined);
	const [monitorStats, setMonitorStats] = useState(undefined);
	useEffect(() => {
		const fetchMonitors = async () => {
			try {
				const res = await networkService.getUptimeDetailsById({
					monitorId: monitorId,
					dateRange: dateRange,
					normalize: true,
				});
				const { monitorData, monitorStats } = res?.data?.data ?? {};
				setMonitor(monitorData);
				setMonitorStats(monitorStats);
			} catch (error) {
				setNetworkError(true);
				createToast({ body: error.message });
			} finally {
				setIsLoading(false);
			}
		};
		fetchMonitors();
	}, [dateRange, monitorId, trigger]);
	return [monitor, monitorStats, isLoading, networkError];
};

export const useCreateMonitor = () => {
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();
	const createMonitor = async ({ monitor, redirect }) => {
		try {
			setIsLoading(true);
			await networkService.createMonitor({ monitor });
			createToast({ body: "Monitor created successfully!" });
			if (redirect) {
				navigate(redirect);
			}
		} catch (error) {
			createToast({ body: "Failed to create monitor." });
		} finally {
			setIsLoading(false);
		}
	};
	return [createMonitor, isLoading];
};

export const useFetchGlobalSettings = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [globalSettings, setGlobalSettings] = useState(undefined);
	useEffect(() => {
		const fetchGlobalSettings = async () => {
			try {
				const res = await networkService.getAppSettings();
				setGlobalSettings(res?.data);
			} catch (error) {
				console.error("Failed to fetch global settings:", error);
				createToast({ body: "Failed to load global settings" });
			} finally {
				setIsLoading(false);
			}
		};

		fetchGlobalSettings();
	}, []);

	return [globalSettings, isLoading];
};

export const useDeleteMonitor = () => {
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();
	const deleteMonitor = async ({ monitor, redirect }) => {
		try {
			setIsLoading(true);
			await networkService.deleteMonitorById({ monitorId: monitor.id });
			createToast({ body: "Monitor deleted successfully!" });
			if (redirect) {
				navigate(redirect);
			}
		} catch (error) {
			createToast({ body: "Failed to delete monitor." });
		} finally {
			setIsLoading(false);
		}
	};
	return [deleteMonitor, isLoading];
};

export const useUpdateMonitor = () => {
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();
	const updateMonitor = async ({ monitor, redirect }) => {
		try {
			setIsLoading(true);
			const updatedFields = {
				name: monitor.name,
				statusWindowSize: monitor.statusWindowSize,
				statusWindowThreshold: monitor.statusWindowThreshold,
				description: monitor.description,
				interval: monitor.interval,
				notifications: monitor.notifications,
				matchMethod: monitor.matchMethod,
				expectedValue: monitor.expectedValue,
				ignoreTlsErrors: monitor.ignoreTlsErrors,
				jsonPath: monitor.jsonPath,
				...((monitor.type === "port" || monitor.type === "game") && {
					port: monitor.port,
				}),
				...(monitor.type == "game" && {
					gameId: monitor.gameId,
				}),
				...(monitor.type === "hardware" && {
					thresholds: monitor.thresholds,
					secret: monitor.secret,
					selectedDisks: monitor.selectedDisks,
				}),
			};
			await networkService.updateMonitor({
				monitorId: monitor.id,
				updatedFields,
			});

			createToast({ body: "Monitor updated successfully!" });
			if (redirect) {
				navigate(redirect);
			}
		} catch (error) {
			createToast({ body: "Failed to update monitor." });
		} finally {
			setIsLoading(false);
		}
	};
	return [updateMonitor, isLoading];
};

export const usePauseMonitor = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(undefined);
	const pauseMonitor = async ({ monitorId, triggerUpdate }) => {
		try {
			setIsLoading(true);
			const res = await networkService.pauseMonitorById({ monitorId });
			createToast({
				body: res.data.data.isActive
					? "Monitor resumed successfully"
					: "Monitor paused successfully",
			});
			triggerUpdate();
		} catch (error) {
			setError(error);
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
			return [true, response.data, null]; // [success, data, error]
		} catch (err) {
			const errorMessage = err?.response?.data?.msg || err.message;
			return [false, null, errorMessage];
		} finally {
			setIsLoading(false);
		}
	};

	return [createBulkMonitors, isLoading];
};

export const useExportMonitors = () => {
	const [isLoading, setIsLoading] = useState(false);
	const { t } = useTranslation();

	const exportMonitors = async () => {
		setIsLoading(true);
		try {
			const response = await networkService.exportMonitors();

			// Create a download link
			const url = window.URL.createObjectURL(response.data);
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", "monitors.csv");
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);

			createToast({ body: t("export.success") });
			return [true, null];
		} catch (err) {
			const errorMessage = err?.response?.data?.msg || err.message;
			createToast({ body: errorMessage || t("export.failed") });
			return [false, errorMessage];
		} finally {
			setIsLoading(false);
		}
	};

	return [exportMonitors, isLoading];
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
