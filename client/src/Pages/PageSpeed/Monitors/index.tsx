import {
	MonitorBasePageWithStates,
	PageSpeedKeyPriorityFallback,
} from "@/Components/design-elements";
import { Dialog } from "@/Components/inputs";
import { HeaderCreate } from "@/Components/common";
import { PageSpeedMonitorsTable } from "@/Pages/PageSpeed/Monitors/Components/PageSpeedMonitorsTable";
import type { Monitor } from "@/Types/Monitor";

import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import { useGet, useDelete } from "@/Hooks/UseApi";
import type { MonitorsWithChecksResponse } from "@/Types/Monitor";
import type { AppSettingsResponse } from "@/Types/Settings";
import { HeaderMonitorsSummary } from "@/Components/monitors";

const PageSpeedMonitorsPage = () => {
	const { t } = useTranslation();
	const isAdmin = useIsAdmin();
	const { deleteFn, loading: isDeleting } = useDelete();

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

	const monitorsWithChecksUrl = useMemo(() => {
		const params = new URLSearchParams();
		params.append("type", "pagespeed");
		params.append("limit", "25");
		if (page !== undefined) params.append("page", String(page));
		if (rowsPerPage) params.append("rowsPerPage", String(rowsPerPage));
		if (sortField) params.append("field", sortField);
		if (sortOrder) params.append("order", sortOrder);
		return `/monitors/team/with-checks?${params.toString()}`;
	}, [page, rowsPerPage, sortField, sortOrder]);

	const {
		data: monitorsData,
		isLoading: monitorsIsLoading,
		error: monitorsError,
		refetch,
	} = useGet<MonitorsWithChecksResponse>(
		monitorsWithChecksUrl,
		{},
		{ refreshInterval: 30000 }
	);

	const monitors = monitorsData?.monitors;
	const monitorsCount = monitorsData?.count ?? 0;
	const summary = monitorsData?.summary ?? null;

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
			<HeaderMonitorsSummary summary={summary} />
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
