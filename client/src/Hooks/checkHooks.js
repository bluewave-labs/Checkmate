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

const useAckMonitorChecks = () => {
	const [isLoading, setIsLoading] = useState(false);
	const { t } = useTranslation();

	const ackMonitorChecks = async (monitorId, setUpdateTrigger) => {
		try {
			setIsLoading(true);
		} catch (error) {
			createToast({ body: t("checkHooks.failureResolveMonitor") });
		} finally {
			setIsLoading(false);
		}
	};

	return [ackMonitorChecks, isLoading];
};

const useAckAllChecks = () => {
	const [isLoading, setIsLoading] = useState(false);
	const { t } = useTranslation();

	const ackAllChecks = async (setUpdateTrigger) => {
		try {
			setIsLoading(true);
			await networkService.updateAllChecksStatus({ ack: true });
			setUpdateTrigger((prev) => !prev);
		} catch (error) {
			createToast({ body: t("checkHooks.failureResolveAll") });
		} finally {
			setIsLoading(false);
		}
	};

	return [ackAllChecks, isLoading];
};

export {
	useFetchChecksByMonitor,
	useFetchChecksTeam,
	useFetchChecksSummaryByTeamId,
	useResolveIncident,
	useAckMonitorChecks,
	useAckAllChecks,
};
