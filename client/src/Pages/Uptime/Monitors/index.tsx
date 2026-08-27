import { MonitorListPage } from "@/Components/monitors";
import { MonitorTable } from "@/Pages/Uptime/Monitors/Components/UptimeMonitorsTable";

import { useMonitorListController } from "@/Hooks/useMonitorListController";

const UptimeMonitorsPage = () => {
	const c = useMonitorListController({
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
			controller={c}
			bulkActions
		>
			<MonitorTable
				monitors={c.monitors || []}
				tags={c.tags || []}
				refetch={c.refetch}
				setSelectedMonitor={c.setSelectedMonitor}
				count={c.count || 0}
				page={c.page}
				setPage={c.setPage}
				rowsPerPage={c.rowsPerPage}
				sortField={c.sortField}
				setSortField={c.setSortField}
				sortOrder={c.sortOrder}
				setSortOrder={c.setSortOrder}
				setRowsPerPage={c.handleSetRowsPerPage}
				selectedRows={c.selectedRows}
				onSelectionChange={c.setSelectedRows}
			/>
		</MonitorListPage>
	);
};

export default UptimeMonitorsPage;
