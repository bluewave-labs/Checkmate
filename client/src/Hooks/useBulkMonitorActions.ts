import { useState, useEffect } from "react";
import axios from "axios";
import { post } from "@/Utils/ApiClient";
import { useToast } from "@/Hooks/UseToast";
import { useTranslation } from "react-i18next";
import { logger } from "@/Utils/logger";
import type { Monitor } from "@/Types/Monitor";

interface ApiResponse {
	success: boolean;
	msg: string;
	data: Monitor[] | number;
}

interface UseBulkMonitorActionsReturn {
	selectedRows: string[];
	setSelectedRows: (rows: string[]) => void;
	handleBulkPause: () => Promise<void>;
	handleBulkResume: () => Promise<void>;
	handleBulkAddNotifications: (notificationIds: string[]) => Promise<void>;
	handleBulkRemoveNotifications: (notificationIds: string[]) => Promise<void>;
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
		} catch (err: unknown) {
			let errMsg = "An error occurred";

			if (axios.isAxiosError(err)) {
				errMsg = err.response?.data?.msg || err.message || errMsg;
			} else if (err instanceof Error) {
				errMsg = err.message;
			}

			logger.error("Bulk pause/resume failed", err instanceof Error ? err : undefined, {
				pause,
			});
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

	const handleBulkNotifications = (action: "add" | "remove") => {
		return async (notificationIds: string[]) => {
			try {
				const res = await post<ApiResponse>("/monitors/notifications", {
					monitorIds: selectedRows,
					notificationIds,
					action,
				});

				const affectedCount = typeof res.data?.data === "number" ? res.data.data : 0;

				if (affectedCount === 0) {
					toastInfo(
						t("pages.common.monitors.bulkNotifications.noChange", {
							count: selectedRows.length,
						})
					);
				} else {
					const key =
						action === "add"
							? "pages.common.monitors.bulkNotifications.added"
							: "pages.common.monitors.bulkNotifications.removed";
					toastSuccess(t(key, { count: affectedCount }));
				}

				setSelectedRows([]);
				refetch();
			} catch (err: unknown) {
				let errMsg = "An error occurred";

				if (axios.isAxiosError(err)) {
					errMsg = err.response?.data?.msg || err.message || errMsg;
				} else if (err instanceof Error) {
					errMsg = err.message;
				}

				logger.error(
					"Bulk notification update failed",
					err instanceof Error ? err : undefined,
					{ action }
				);
				toastError(errMsg);
			}
		};
	};

	return {
		selectedRows,
		setSelectedRows,
		handleBulkPause,
		handleBulkResume,
		handleBulkAddNotifications: handleBulkNotifications("add"),
		handleBulkRemoveNotifications: handleBulkNotifications("remove"),
		handleCancelSelection,
	};
};
