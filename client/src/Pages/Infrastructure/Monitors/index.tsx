import { MonitorListPage } from "@/Components/monitors";
import { InfraMonitorsTable } from "@/Pages/Infrastructure/Monitors/Components/MonitorsTable";

import { useMonitorListController } from "@/Hooks/useMonitorListController";

const InfrastructureMonitors = () => {
	const c = useMonitorListController({
		types: ["hardware"],
		checksLimit: 1,
		refreshInterval: 5000,
		rowsPerPageTable: "infrastructure",
		rowsPerPageDefault: 5,
	});
	return (
		<MonitorListPage
			headerKey="infrastructure"
			page="infrastructure"
			actionLink="/infrastructure/create"
			controller={c}
			bulkActions
			showTypeFilter={false}
			summaryProps={{ showBreached: true }}
		>
			<InfraMonitorsTable
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

export default InfrastructureMonitors;
