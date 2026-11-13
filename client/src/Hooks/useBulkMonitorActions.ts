import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { post } from "@/Utils/ApiClient";
import { useToast } from "@/Hooks/UseToast";
import { useTranslation } from "react-i18next";
import { logger } from "@/Utils/logger";
import type { Monitor } from "@/Types/Monitor";

interface ApiResponse {
	success: boolean;
	msg: string;
	data: {
		monitors: Monitor[];
		failedCount: number;
	};
}

interface BulkDeleteResponse {
	success: boolean;
	msg: string;
	data: {
		deletedCount: number;
		failedCount: number;
	};
}

export interface BulkDeleteTarget {
	id: string;
	monitor?: Monitor;
	// Selected, but filtered or searched out of the list currently shown
	hidden: boolean;
}

interface UseBulkMonitorActionsReturn {
	selectedRows: string[];
	setSelectedRows: (rows: string[]) => void;
	handleBulkPause: () => Promise<void>;
	handleBulkResume: () => Promise<void>;
	handleCancelSelection: () => void;
	isBulkDeleteDialogOpen: boolean;
	bulkDeleteTargets: BulkDeleteTarget[];
	isBulkDeleting: boolean;
	handleOpenBulkDelete: () => void;
	handleCancelBulkDelete: () => void;
	handleConfirmBulkDelete: () => Promise<void>;
}

const getErrorMessage = (err: unknown) => {
	if (axios.isAxiosError(err)) {
		return err.response?.data?.msg || err.message || "An error occurred";
	}
	if (err instanceof Error) {
		return err.message;
	}
	return "An error occurred";
};

export const useBulkMonitorActions = (
	refetch: () => void,
	page?: number,
	monitors?: Monitor[] | null
): UseBulkMonitorActionsReturn => {
	const [selectedRows, setSelectedRows] = useState<string[]>([]);
	const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
	const [bulkDeleteTargets, setBulkDeleteTargets] = useState<BulkDeleteTarget[]>([]);
	const [isBulkDeleting, setIsBulkDeleting] = useState(false);
	const knownMonitors = useRef(new Map<string, Monitor>());
	const { toastSuccess, toastError, toastInfo, toastWarning } = useToast();
	const { t } = useTranslation();

	// Clear selection when page changes
	useEffect(() => {
		setSelectedRows([]);
	}, [page]);

	// Remember every listed monitor, so the delete dialog can describe a selected
	// monitor even after a search or filter has hidden it
	useEffect(() => {
		monitors?.forEach((monitor) => knownMonitors.current.set(monitor.id, monitor));
	}, [monitors]);

	const executeBulkAction = async (pause: boolean) => {
		try {
			const res = await post<ApiResponse>("/monitors/bulk/pause", {
				monitorIds: selectedRows,
				pause,
			});

			const affectedCount = res.data?.data?.monitors?.length ?? 0;
			const failedCount = res.data?.data?.failedCount ?? 0;

			if (affectedCount === 0) {
				const key = pause
					? "pages.common.monitors.bulkPause.alreadyPaused"
					: "pages.common.monitors.bulkPause.alreadyRunning";
				toastInfo(t(key, { count: selectedRows.length }));
			} else if (failedCount > 0) {
				toastWarning(
					t("pages.common.monitors.bulkPause.partialFailure", {
						successCount: affectedCount,
						failedCount,
					})
				);
			} else {
				const key = pause
					? "pages.common.monitors.bulkPause.paused"
					: "pages.common.monitors.bulkPause.resumed";
				toastSuccess(t(key, { count: affectedCount }));
			}

			setSelectedRows([]);
			refetch();
		} catch (err: unknown) {
			logger.error("Bulk pause/resume failed", err instanceof Error ? err : undefined, {
				pause,
			});
			toastError(getErrorMessage(err));
		}
	};

	const handleOpenBulkDelete = () => {
		const listedIds = new Set(monitors?.map((monitor) => monitor.id));
		setBulkDeleteTargets(
			selectedRows.map((id) => ({
				id,
				monitor: knownMonitors.current.get(id),
				hidden: !listedIds.has(id),
			}))
		);
		setIsBulkDeleteDialogOpen(true);
	};

	const handleCancelBulkDelete = () => {
		setIsBulkDeleteDialogOpen(false);
	};

	const handleConfirmBulkDelete = async () => {
		setIsBulkDeleting(true);
		try {
			const res = await post<BulkDeleteResponse>("/monitors/bulk/delete", {
				monitorIds: selectedRows,
			});

			const deletedCount = res.data?.data?.deletedCount ?? 0;
			const failedCount = res.data?.data?.failedCount ?? 0;

			if (failedCount > 0) {
				toastWarning(
					t("pages.common.monitors.bulkDelete.partialFailure", {
						successCount: deletedCount,
						failedCount,
					})
				);
			} else {
				toastSuccess(
					t("pages.common.monitors.bulkDelete.deleted", { count: deletedCount })
				);
			}

			setSelectedRows([]);
			setIsBulkDeleteDialogOpen(false);
			refetch();
		} catch (err: unknown) {
			logger.error("Bulk delete failed", err instanceof Error ? err : undefined, {
				count: selectedRows.length,
			});
			toastError(getErrorMessage(err));
		} finally {
			setIsBulkDeleting(false);
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
		isBulkDeleteDialogOpen,
		bulkDeleteTargets,
		isBulkDeleting,
		handleOpenBulkDelete,
		handleCancelBulkDelete,
		handleConfirmBulkDelete,
	};
};
