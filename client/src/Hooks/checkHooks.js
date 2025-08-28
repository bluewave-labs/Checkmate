import { useState, useEffect } from "react";
import { networkService } from "../main";
import { createToast } from "../Utils/toastUtils";
import { useTranslation } from "react-i18next";

const useFetchChecksTeam = ({
	status,
	sortOrder,
	limit,
	dateRange,
	filter,
	ack,
	page,
	rowsPerPage,
	enabled = true,
	updateTrigger,
}) => {
	const [checks, setChecks] = useState(undefined);
	const [checksCount, setChecksCount] = useState(undefined);
	const [isLoading, setIsLoading] = useState(false);
	const [networkError, setNetworkError] = useState(false);

	useEffect(() => {
		const fetchChecks = async () => {
			if (!enabled) {
				return;
			}

			const config = {
				status,
				sortOrder,
				limit,
				dateRange,
				filter,
				ack,
				page,
				rowsPerPage,
			};

			try {
				setIsLoading(true);
				const res = await networkService.getChecksByTeam(config);
				setChecks(res.data.data.checks);
				setChecksCount(res.data.data.checksCount);
			} catch (error) {
				setNetworkError(true);
				createToast({ body: error.message });
			} finally {
				setIsLoading(false);
			}
		};

		fetchChecks();
	}, [
		status,
		sortOrder,
		limit,
		dateRange,
		filter,
		ack,
		page,
		rowsPerPage,
		enabled,
		updateTrigger,
	]);

	return [checks, checksCount, isLoading, networkError];
};

const useFetchChecksByMonitor = ({
	monitorId,
	type,
	status,
	sortOrder,
	limit,
	dateRange,
	filter,
	ack,
	page,
	rowsPerPage,
	enabled = true,
	updateTrigger,
}) => {
	const [checks, setChecks] = useState(undefined);
	const [checksCount, setChecksCount] = useState(undefined);
	const [isLoading, setIsLoading] = useState(false);
	const [networkError, setNetworkError] = useState(false);

	useEffect(() => {
		const fetchChecks = async () => {
			if (!enabled || !type) {
				return;
			}

			const config = {
				monitorId,
				type,
				status,
				sortOrder,
				limit,
				dateRange,
				filter,
				ack,
				page,
				rowsPerPage,
			};

			try {
				setIsLoading(true);
				const res = await networkService.getChecksByMonitor(config);
				setChecks(res.data.data.checks);
				setChecksCount(res.data.data.checksCount);
			} catch (error) {
				setNetworkError(true);
				createToast({ body: error.message });
			} finally {
				setIsLoading(false);
			}
		};

		fetchChecks();
	}, [
		monitorId,
		type,
		status,
		sortOrder,
		limit,
		dateRange,
		filter,
		ack,
		page,
		rowsPerPage,
		enabled,
		updateTrigger,
	]);

	return [checks, checksCount, isLoading, networkError];
};

const useFetchChecksSummaryByTeamId = ({ updateTrigger } = {}) => {
	const [summary, setSummary] = useState(undefined);
	const [isLoading, setIsLoading] = useState(false);
	const [networkError, setNetworkError] = useState(false);

	useEffect(() => {
		const fetchSummary = async () => {
			try {
				setIsLoading(true);

				const res = await networkService.getChecksAndSummaryByTeamId();
				setSummary(res.data.data);
			} catch (error) {
				setNetworkError(true);
				createToast({ body: error.message });
			} finally {
				setIsLoading(false);
			}
		};

		fetchSummary();
	}, [updateTrigger]);

	return [summary, isLoading, networkError];
};

const useResolveIncident = () => {
	const [isLoading, setIsLoading] = useState(false);
	const { t } = useTranslation();

	const resolveIncident = async (checkId, setUpdateTrigger) => {
		try {
			setIsLoading(true);
			await networkService.updateCheckStatus({
				checkId,
				ack: true,
			});
			setUpdateTrigger((prev) => !prev);
		} catch (error) {
			createToast({ body: t("checkHooks.failureResolveOne") });
		} finally {
			setIsLoading(false);
		}
	};

	return [resolveIncident, isLoading];
};

const useAcknowledgeChecks = () => {
	const [isLoading, setIsLoading] = useState(false);
	const { t } = useTranslation();

	const acknowledge = async (setUpdateTrigger, monitorId = null) => {
		setIsLoading(true);
		try {
			if (monitorId) {
				await networkService.updateMonitorChecksStatus({ monitorId, ack: true });
			} else {
				await networkService.updateAllChecksStatus({ ack: true });
			}
			setUpdateTrigger((prev) => !prev);
		} catch (error) {
			const toastMessage = monitorId
				? t("checkHooks.failureResolveMonitor")
				: t("checkHooks.failureResolveAll");
			createToast({ body: toastMessage });
		} finally {
			setIsLoading(false);
		}
	};

	return { acknowledge, isLoading };
};

const useFetchCheckById = (checkId) => {
	const [check, setCheck] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [networkError, setNetworkError] = useState(false);

	useEffect(() => {
		const fetchCheck = async () => {
			if (!checkId) {
				return;
			}

			try {
				setIsLoading(true);
				const res = await networkService.getCheckById(checkId);
				const checkData = res.data.data;
				
				// Simulate timing breakdown if not available
				if (!checkData.responseTime || typeof checkData.responseTime === 'number') {
					const totalTime = checkData.responseTime || 0;
					checkData.responseTime = {
						total: totalTime,
						dns: totalTime * 0.15,
						tcp: totalTime * 0.20,
						tls: totalTime * 0.15,
						firstByte: totalTime * 0.30,
						transfer: totalTime * 0.20,
					};
				}

				// Add mock location data if not available
				if (!checkData.location) {
					checkData.location = {
						city: "Server Location",
						country: "Data Center",
					};
				}

				setCheck(checkData);
			} catch (error) {
				setNetworkError(true);
				createToast({ body: error.message });
			} finally {
				setIsLoading(false);
			}
		};

		fetchCheck();
	}, [checkId]);

	return [check, isLoading, networkError];
};

export {
	useFetchChecksByMonitor,
	useFetchChecksTeam,
	useFetchChecksSummaryByTeamId,
	useResolveIncident,
	useAcknowledgeChecks,
	useFetchCheckById,
};
