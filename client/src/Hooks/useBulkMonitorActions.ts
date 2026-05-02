import { useState, useEffect } from "react";
import { post } from "@/Utils/ApiClient";
import { useToast } from "@/Hooks/UseToast";
import { useTranslation } from "react-i18next";
import { logger } from "@/Utils/logger";
import type { Monitor } from "@/Types/Monitor";

interface ApiResponse {
	success: boolean;
	msg: string;
	data: Monitor[];
}

interface UseBulkMonitorActionsReturn {
	selectedRows: string[];
	setSelectedRows: (rows: string[]) => void;
	handleBulkPause: () => Promise<void>;
	handleBulkResume: () => Promise<void>;
	handleCancelSelection: () => void;
}

export const useBulkMonitorActions = (
	refetch: () => void,
	page?: number
): UseBulkMonitorActionsReturn => {
	const [selectedRows, setSelectedRows] = useState<string[]>([]);
	const { toastSuccess, toastError, toastInfo } = useToast();
	const { t } = useTranslation();

	// Clear selection when page changes
	useEffect(() => {
		setSelectedRows([]);
	}, [page]);

	const executeBulkAction = async (pause: boolean) => {
		try {
			const res = await post<ApiResponse>("/monitors/bulk/pause", {
				monitorIds: selectedRows,
				pause,
			});

			const affectedCount = res.data?.data?.length ?? 0;

			if (affectedCount === 0) {
				const key = pause
					? "pages.common.monitors.bulkPause.alreadyPaused"
					: "pages.common.monitors.bulkPause.alreadyRunning";
				toastInfo(t(key, { count: selectedRows.length }));
			} else {
				const key = pause
					? "pages.common.monitors.bulkPause.paused"
					: "pages.common.monitors.bulkPause.resumed";
				toastSuccess(t(key, { count: affectedCount }));
			}

			setSelectedRows([]);
			refetch();
		} catch (err: any) {
			const errMsg = err?.response?.data?.msg || err.message || "An error occurred";
			logger.error("Bulk pause/resume failed", err, { pause });
			toastError(errMsg);
		}
	};

	const handleBulkPause = async () => {
		await executeBulkAction(true);
	};

	const handleBulkResume = async () => {
		await executeBulkAction(false);
	};

	const handleCancelSelection = () => {
		setSelectedRows([]);
	};

	return {
		selectedRows,
		setSelectedRows,
		handleBulkPause,
		handleBulkResume,
		handleCancelSelection,
	};
};
