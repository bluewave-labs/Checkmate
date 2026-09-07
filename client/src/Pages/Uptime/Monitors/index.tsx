import { MonitorListPage } from "@/Components/monitors";
import { MonitorTable } from "@/Pages/Uptime/Monitors/Components/UptimeMonitorsTable";

import { useMonitorListController } from "@/Hooks/useMonitorListController";

const UptimeMonitorsPage = () => {
	const monitorListController = useMonitorListController({
		types: "selectable",
		checksLimit: 25,
		refreshInterval: 5000,
		rowsPerPageTable: "monitors",
		rowsPerPageDefault: 10,
	});

	return (
		<MonitorListPage
			headerKey="uptime"
			page="uptime"
			actionLink="/uptime/create"
			controller={monitorListController}
			bulkActions
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
		</MonitorListPage>
	);
};

export default UptimeMonitorsPage;
