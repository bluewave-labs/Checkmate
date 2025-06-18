import { useState, useEffect } from "react";
import { networkService } from "../main";
import { createToast } from "../Utils/toastUtils";

const useFetchChecksTeam = ({
	status,
	sortOrder,
	limit,
	dateRange,
	filter,
	page,
	rowsPerPage,
	enabled = true,
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
	}, [status, sortOrder, limit, dateRange, filter, page, rowsPerPage, enabled]);

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
	page,
	rowsPerPage,
	enabled = true,
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
		page,
		rowsPerPage,
		enabled,
	]);

	return [checks, checksCount, isLoading, networkError];
};

export { useFetchChecksByMonitor, useFetchChecksTeam };
