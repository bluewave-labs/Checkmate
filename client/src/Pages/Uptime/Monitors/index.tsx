import { useMonitorListController } from "@/Hooks/useMonitorListController";
import { MonitorListPage, BulkEditNotificationsModal } from "@/Components/monitors";
import { MonitorTable } from "./Components/UptimeMonitorsTable";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/Components/inputs";

const UptimeMonitorsPage = () => {
	const { t } = useTranslation();
	const monitorListController = useMonitorListController({
		types: "selectable",
		checksLimit: 25,
		refreshInterval: 5000,
		rowsPerPageTable: "monitors",
		rowsPerPageDefault: 10,
	});

	const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

	const handleBulkEditComplete = (success: boolean) => {
		setIsBulkEditModalOpen(false);
		if (success) {
			monitorListController.setSelectedRows([]);
			monitorListController.refetch();
		}
	};

	return (
		<MonitorListPage
			headerKey="uptime"
			page="uptime"
			actionLink="/uptime/create"
			controller={monitorListController}
			bulkActions
			bulkActionsHidden={isBulkEditModalOpen}
			bulkActionsExtra={
				<Button
					size="small"
					onClick={() => setIsBulkEditModalOpen(true)}
				>
					{t("pages.common.monitors.bulkEdit.editButton")}
				</Button>
			}
		>
			<MonitorTable
				monitors={monitorListController.monitors || []}
				tags={monitorListController.tags || []}
				refetch={monitorListController.refetch}
				setSelectedMonitor={monitorListController.setSelectedMonitor}
				count={monitorListController.count || 0}
				page={monitorListController.page}
				setPage={monitorListController.setPage}
				rowsPerPage={monitorListController.rowsPerPage}
				sortField={monitorListController.sortField}
				setSortField={monitorListController.setSortField}
				sortOrder={monitorListController.sortOrder}
				setSortOrder={monitorListController.setSortOrder}
				setRowsPerPage={monitorListController.handleSetRowsPerPage}
				selectedRows={monitorListController.selectedRows}
				onSelectionChange={monitorListController.setSelectedRows}
			/>
			<BulkEditNotificationsModal
				open={isBulkEditModalOpen}
				onClose={() => setIsBulkEditModalOpen(false)}
				selectedMonitors={monitorListController.selectedRows}
				onComplete={handleBulkEditComplete}
			/>
		</MonitorListPage>
	);
};

export default UptimeMonitorsPage;
