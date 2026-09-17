import { MonitorListPage } from "@/Components/monitors";
import { DockerMonitorsTable } from "@/Pages/Docker/Monitors/Components/DockerMonitorsTable";
import { useMonitorListController } from "@/Hooks/useMonitorListController";

const DockerMonitorsPage = () => {
	const c = useMonitorListController({
		types: ["docker"],
		checksLimit: 25,
		refreshInterval: 5000,
		rowsPerPageTable: "docker",
		rowsPerPageDefault: 10,
	});

	return (
		<MonitorListPage
			headerKey="docker"
			page="docker"
			actionLink="/docker/create"
			controller={c}
			bulkActions
			showTypeFilter={false}
		>
			<DockerMonitorsTable
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

export default DockerMonitorsPage;
