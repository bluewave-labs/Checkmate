import { BasePage } from "@/Components/design-elements";
import { HeaderMonitorControls, MonitorStatBoxes } from "@/Components/monitors";
import { DockerStatusBoxes } from "@/Pages/Docker/HostDetails/Components/StatBoxes";

// Types
import type { DockerDetailsResponse } from "@/Types/Monitor";

// Hooks
import { useGet } from "@/Hooks/UseApi";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import { useParams } from "react-router-dom";
import { DockerContainersTable } from "@/Pages/Docker/HostDetails/Components/DockerContainersTable";

const DockerHostDetailsPage = () => {
	const { monitorId } = useParams<{ monitorId: string }>();
	const isAdmin = useIsAdmin();

	// The containers list renders the latest check only, so no date range is
	// offered; the endpoint's dateRange param only shapes the aggregate buckets.
	const monitorDetailsUrl = monitorId ? `/monitors/docker/details/${monitorId}` : null;

	const { data: monitorDetailsData, refetch: refetchMonitor } =
		useGet<DockerDetailsResponse>(
			monitorDetailsUrl,
			{},
			{ refreshInterval: 10000, keepPreviousData: true }
		);

	const monitor = monitorDetailsData?.monitor;
	const monitorStats = monitorDetailsData?.monitorStats ?? null;
	const stats = monitorDetailsData?.stats;
	const containers = stats?.latest?.containers ?? [];

	return (
		<BasePage>
			<HeaderMonitorControls
				path="docker"
				monitor={monitor}
				isAdmin={isAdmin}
				refetch={refetchMonitor}
			/>
			<MonitorStatBoxes
				monitor={monitor}
				monitorStats={monitorStats}
			/>
			<DockerStatusBoxes stats={stats} />
			<DockerContainersTable
				monitorId={monitorId}
				containers={containers}
			/>
		</BasePage>
	);
};

export default DockerHostDetailsPage;
