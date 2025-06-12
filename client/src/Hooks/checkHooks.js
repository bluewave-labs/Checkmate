import { useState, useEffect } from "react";
import { networkService } from "../main";
import { createToast } from "../Utils/toastUtils";

const useFetchChecks = ({
	teamId,
	monitorId,
	type,
	status,
	sortOrder,
	limit,
	dateRange,
	filter,
	page,
	rowsPerPage,
}) => {
	const [checks, setChecks] = useState(undefined);
	const [checksCount, setChecksCount] = useState(undefined);
	const [isLoading, setIsLoading] = useState(false);
	const [networkError, setNetworkError] = useState(false);

	useEffect(() => {
		const fetchChecks = async () => {
			if (!type && !teamId) {
				return;
			}

			const method = monitorId
				? networkService.getChecksByMonitor
				: networkService.getChecksByTeam;

			const config = monitorId
				? {
						monitorId,
						type,
						status,
						sortOrder,
						limit,
						dateRange,
						filter,
						page,
						rowsPerPage,
					}
				: {
						status,
						teamId,
						sortOrder,
						limit,
						dateRange,
						filter,
						page,
						rowsPerPage,
					};

			try {
				setIsLoading(true);
				const res = await method(config);
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
		teamId,
		type,
		status,
		sortOrder,
		limit,
		dateRange,
		filter,
		page,
		rowsPerPage,
	]);

	return [checks, checksCount, isLoading, networkError];
};

export { useFetchChecks };
