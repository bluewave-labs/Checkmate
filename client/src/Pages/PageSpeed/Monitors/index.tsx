import {
	MonitorBasePageWithStates,
	// UpStatusBox,
	// DownStatusBox,
	// PausedStatusBox,
} from "@/Components/v2/design-elements";
import { HeaderCreate } from "@/Components/v2/common";
// import Stack from "@mui/material/Stack";
import { PageSpeedMonitorsTable } from "@/Pages/PageSpeed/Monitors/Components/PageSpeedMonitorsTable";

import { useState } from "react";
import { useTheme } from "@mui/material";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import { useGet } from "@/Hooks/UseApi";
import type { MonitorsWithChecksResponse } from "@/Types/Monitor";
import type { AppSettingsResponse } from "@/Types/Settings";

const PageSpeedMonitorsPage = () => {
	const theme = useTheme();
	const isAdmin = useIsAdmin();
	const monitorsUrl = "/monitors/team/with-checks?type=pagespeed&limit=10";
	const {
		data: monitorsData,
		isLoading: monitorsIsLoading,
		error: monitorsError,
		refetch,
	} = useGet<MonitorsWithChecksResponse>(monitorsUrl);

	const settingsUrl = "/settings";
	const {
		data: settingsData,
		isLoading: settingsIsLoading,
		error: settingsError,
	} = useGet<AppSettingsResponse>(settingsUrl);

	const monitors = monitorsData?.monitors;
	const monitorsCount = monitorsData?.count;
	// const summary = monitorsData?.summary;
	const settings = settingsData;

	const isLoading = monitorsIsLoading || settingsIsLoading;

	const [sortField, setSortField] = useState<string>("name");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	return (
		<MonitorBasePageWithStates
			loading={isLoading}
			error={monitorsError || settingsError}
			items={monitors || []}
			page="pageSpeed"
			actionLink="/pagespeed/create"
		>
			<HeaderCreate
				path="/pagespeed/create"
				isLoading={isLoading}
				isAdmin={isAdmin}
			/>
			{/* <Stack
				direction={{ xs: "column", md: "row" }}
				gap={theme.spacing(8)}
			>
				<UpStatusBox n={summary?.upMonitors || 0} />
				<DownStatusBox n={summary?.downMonitors || 0} />
				<PausedStatusBox n={summary?.pausedMonitors || 0} />
			</Stack> */}
			<PageSpeedMonitorsTable
				monitors={monitors || []}
				refetch={refetch}
				sortField={sortField}
				setSortField={setSortField}
				sortOrder={sortOrder}
				setSortOrder={setSortOrder}
				count={monitorsCount || 0}
				page={page}
				setPage={setPage}
				rowsPerPage={rowsPerPage}
				setRowsPerPage={setRowsPerPage}
			/>
		</MonitorBasePageWithStates>
	);
};

export default PageSpeedMonitorsPage;
