import { PageSpeedKeyPriorityFallback } from "@/Components/design-elements";
import { PageSpeedMonitorsTable } from "@/Pages/PageSpeed/Monitors/Components/PageSpeedMonitorsTable";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import { useGet } from "@/Hooks/UseApi";
import type { AppSettingsResponse } from "@/Types/Settings";
import { MonitorListPage } from "@/Components/monitors";
import { useMonitorListController } from "@/Hooks/useMonitorListController";

const PageSpeedMonitorsPage = () => {
	const isAdmin = useIsAdmin();
	const {
		data: settingsData,
		isLoading: settingsIsLoading,
		error: settingsError,
	} = useGet<AppSettingsResponse>("/settings");

	const c = useMonitorListController({
		types: ["pagespeed"],
		checksLimit: 25,
		refreshInterval: 30000,
		rowsPerPageTable: "pagespeed",
		rowsPerPageDefault: 10,
		initialSortField: "name",
	});

	const showApiKeyWarning = isAdmin && settingsData && !settingsData.pagespeedKeySet;

	return (
		<MonitorListPage
			headerKey="pageSpeed"
			page="pageSpeed"
			actionLink="/pagespeed/create"
			controller={c}
			showTypeFilter={false}
			extraLoading={settingsIsLoading}
			extraError={settingsError}
			priorityFallback={showApiKeyWarning ? <PageSpeedKeyPriorityFallback /> : undefined}
		>
			<PageSpeedMonitorsTable
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
			/>
		</MonitorListPage>
	);
};

export default PageSpeedMonitorsPage;
