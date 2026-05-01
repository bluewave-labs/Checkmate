import { useState, useEffect } from "react";
import { usePost } from "@/Hooks/UseApi";

interface BulkPauseBody {
	monitorIds: string[];
	pause: boolean;
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
	const { post: bulkPost } = usePost<BulkPauseBody>();

	// Clear selection when page changes
	useEffect(() => {
		setSelectedRows([]);
	}, [page]);

	const handleBulkPause = async () => {
		const result = await bulkPost("/monitors/bulk/pause", {
			monitorIds: selectedRows,
			pause: true,
		});
		if (result) {
			setSelectedRows([]);
			refetch();
		}
	};

	const handleBulkResume = async () => {
		const result = await bulkPost("/monitors/bulk/pause", {
			monitorIds: selectedRows,
			pause: false,
		});
		if (result) {
			setSelectedRows([]);
			refetch();
		}
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
