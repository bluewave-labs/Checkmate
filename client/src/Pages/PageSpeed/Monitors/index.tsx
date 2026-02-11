import {
	MonitorBasePageWithStates,
	UpStatusBox,
	DownStatusBox,
	PausedStatusBox,
	PageSpeedKeyPriorityFallback,
} from "@/Components/v2/design-elements";
import { Dialog } from "@/Components/v2/inputs";
import { HeaderCreate } from "@/Components/v2/common";
import Stack from "@mui/material/Stack";
import { PageSpeedMonitorsTable } from "@/Pages/PageSpeed/Monitors/Components/PageSpeedMonitorsTable";
import type { Monitor } from "@/Types/Monitor";

import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import { useGet, useDelete } from "@/Hooks/UseApi";
import type { MonitorsWithChecksResponse } from "@/Types/Monitor";
import type { AppSettingsResponse } from "@/Types/Settings";

const PageSpeedMonitorsPage = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isAdmin = useIsAdmin();
	const { deleteFn, loading: isDeleting } = useDelete();

	const monitorsUrl = "/monitors/team/with-checks?type=pagespeed&limit=10";
	const {
		data: monitorsData,
		isLoading: monitorsIsLoading,
		error: monitorsError,
		refetch,
	} = useGet<MonitorsWithChecksResponse>(monitorsUrl, {}, { refreshInterval: 30000 });

	const settingsUrl = "/settings";
	const {
		data: settingsData,
		isLoading: settingsIsLoading,
		error: settingsError,
	} = useGet<AppSettingsResponse>(settingsUrl);

	const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);
	const isDialogOpen = Boolean(selectedMonitor);
	const [sortField, setSortField] = useState<string>("name");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	const monitors = monitorsData?.monitors;
	const monitorsCount = monitorsData?.count;
	const summary = monitorsData?.summary;

	const isLoading = monitorsIsLoading || settingsIsLoading;

	const showApiKeyWarning = isAdmin && settingsData && !settingsData.pagespeedKeySet;

	const handleConfirm = async () => {
		if (!selectedMonitor) return;
		await deleteFn(`/monitors/${selectedMonitor.id}`);
		setSelectedMonitor(null);
		refetch();
	};

	const handleCancel = () => {
		setSelectedMonitor(null);
	};

	return (
		<MonitorBasePageWithStates
			loading={isLoading}
			error={monitorsError || settingsError}
			totalCount={summary?.totalMonitors ?? 0}
			page="pageSpeed"
			actionLink="/pagespeed/create"
			priorityFallback={showApiKeyWarning ? <PageSpeedKeyPriorityFallback /> : undefined}
		>
			<HeaderCreate
				path="/pagespeed/create"
				isLoading={isLoading}
				isAdmin={isAdmin}
			/>
			<Stack
				direction={{ xs: "column", md: "row" }}
				gap={theme.spacing(8)}
			>
				<UpStatusBox n={summary?.upMonitors || 0} />
				<DownStatusBox n={summary?.downMonitors || 0} />
				<PausedStatusBox n={summary?.pausedMonitors || 0} />
			</Stack>
			<PageSpeedMonitorsTable
				monitors={monitors || []}
				refetch={refetch}
				setSelectedMonitor={setSelectedMonitor}
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
			<Dialog
				open={isDialogOpen}
				title={t("common.dialogs.delete.title")}
				content={t("common.dialogs.delete.description")}
				onConfirm={handleConfirm}
				onCancel={handleCancel}
				loading={isDeleting}
			/>
		</MonitorBasePageWithStates>
	);
};

export default PageSpeedMonitorsPage;
