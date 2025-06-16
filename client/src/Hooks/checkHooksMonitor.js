import { useState, useEffect } from "react";
import { networkService } from "../main";
import { createToast } from "../Utils/toastUtils";

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
}) => {
    const [checks, setChecks] = useState(undefined);
	const [checksCount, setChecksCount] = useState(undefined);
	const [isLoading, setIsLoading] = useState(false);
	const [networkError, setNetworkError] = useState(false);

    useEffect(() => {
        const fetchChecks = async () => {
            if (!type) {
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
            }

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
    }, [monitorId, type, status, sortOrder, limit, dateRange, filter, page, rowsPerPage]);

    return [checks, checksCount, isLoading, networkError];
};

export { useFetchChecksByMonitor };