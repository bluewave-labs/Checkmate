import Stack from "@mui/material/Stack";
import {
	BasePage,
	TotalChecksBox,
	UpChecksBox,
	DownChecksBox,
} from "@/Components/v2/design-elements";
import { HeaderTimeRange } from "@/Components/v2/common";
import { Select } from "@/Components/v2/inputs";
import { ChecksTable } from "./Components/ChecksTable";

import { MenuItem } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useGet } from "@/Hooks/UseApi";
import type { Monitor } from "@/Types/Monitor";
import type { ChecksSummary, ChecksResponse } from "@/Types/Check";

const Checks = () => {
	const { t } = useTranslation();
	const { monitorId } = useParams<{ monitorId?: string }>();

	const [selectedMonitor, setSelectedMonitor] = useState<string>(monitorId || "0");
	const [dateRange, setDateRange] = useState<string>("recent");
	const [statusFilter, setStatusFilter] = useState<string>("down");
	const [page, setPage] = useState<number>(0);
	const [rowsPerPage, setRowsPerPage] = useState<number>(10);

	const monitorsUrl = "/monitors/team";
	const summaryUrl = `/checks/team/summary?dateRange=${dateRange}`;

	const { data: monitorsResponse, isLoading: isLoadingMonitors } =
		useGet<Monitor[]>(monitorsUrl);

	const { data: summaryResponse, isLoading: isLoadingSummary } =
		useGet<ChecksSummary>(summaryUrl);

	const selectedMonitorType = monitorsResponse?.find(
		(m) => m.id === selectedMonitor
	)?.type;

	const teamChecksUrl = useMemo(() => {
		if (selectedMonitor !== "0") return null;
		const params = new URLSearchParams();
		params.append("sortOrder", "desc");
		if (dateRange) params.append("dateRange", dateRange);
		if (statusFilter) params.append("filter", statusFilter);
		params.append("page", String(page));
		params.append("rowsPerPage", String(rowsPerPage));
		return `/checks/team?${params.toString()}`;
	}, [selectedMonitor, dateRange, statusFilter, page, rowsPerPage]);

	const monitorChecksUrl = useMemo(() => {
		if (selectedMonitor === "0" || !selectedMonitorType) return null;
		const params = new URLSearchParams();
		params.append("type", selectedMonitorType);
		params.append("sortOrder", "desc");
		if (statusFilter) params.append("filter", statusFilter);
		if (dateRange) params.append("dateRange", dateRange);
		params.append("page", String(page));
		params.append("rowsPerPage", String(rowsPerPage));
		return `/checks/${selectedMonitor}?${params.toString()}`;
	}, [selectedMonitor, selectedMonitorType, dateRange, statusFilter, page, rowsPerPage]);

	const {
		data: teamChecksData,
		isLoading: isLoadingTeamChecks,
		isValidating: isValidatingTeamChecks,
	} = useGet<ChecksResponse>(
		teamChecksUrl,
		{},
		{ keepPreviousData: true, refreshInterval: 30000 }
	);
	const {
		data: monitorChecksData,
		isLoading: isLoadingMonitorChecks,
		isValidating: isValidatingMonitorChecks,
	} = useGet<ChecksResponse>(
		monitorChecksUrl,
		{},
		{ keepPreviousData: true, refreshInterval: 30000 }
	);

	const checks =
		selectedMonitor === "0"
			? (teamChecksData?.checks ?? [])
			: (monitorChecksData?.checks ?? []);
	const checksCount =
		selectedMonitor === "0"
			? (teamChecksData?.checksCount ?? 0)
			: (monitorChecksData?.checksCount ?? 0);

	const isLoadingChecks =
		isLoadingTeamChecks ||
		isLoadingMonitorChecks ||
		isValidatingTeamChecks ||
		isValidatingMonitorChecks;

	const isLoading = isLoadingMonitors || isLoadingSummary || isLoadingChecks;
	const totalChecks = summaryResponse?.totalChecks || 0;
	const downChecks = summaryResponse?.downChecks || 0;
	const upChecks = totalChecks - (summaryResponse?.downChecks || 0);

	return (
		<BasePage>
			<Stack
				direction={{ xs: "column", md: "row" }}
				gap={4}
			>
				<TotalChecksBox n={totalChecks} />
				<UpChecksBox n={upChecks} />
				<DownChecksBox n={downChecks || 0} />
			</Stack>

			<Stack
				direction={{ xs: "column", md: "row" }}
				justifyContent="space-between"
				alignItems={{ xs: "stretch", md: "center" }}
				gap={2}
			>
				<Stack
					gap={2}
					direction={{ xs: "column", md: "row" }}
				>
					<Select
						fullWidth
						value={selectedMonitor}
						onChange={(e: any) => {
							setSelectedMonitor(e.target.value);
							setPage(0);
						}}
					>
						<MenuItem value="0">{t("pages.checks.selects.monitor.all")}</MenuItem>
						{monitorsResponse?.map((monitor) => (
							<MenuItem
								key={monitor.id}
								value={monitor.id}
							>
								{monitor.name}
							</MenuItem>
						))}
					</Select>
					<Select
						value={statusFilter}
						onChange={(e: any) => {
							setStatusFilter(e.target.value);
							setPage(0);
						}}
					>
						<MenuItem value="all">{t("pages.checks.selects.status.all")}</MenuItem>
						<MenuItem value="up">{t("pages.checks.selects.status.up")}</MenuItem>
						<MenuItem value="down">{t("pages.checks.selects.status.down")}</MenuItem>
					</Select>
				</Stack>
				<HeaderTimeRange
					isLoading={isLoading || isLoadingChecks}
					dateRange={dateRange}
					setDateRange={setDateRange}
				/>
			</Stack>

			<ChecksTable
				monitors={monitorsResponse ?? null}
				checks={checks}
				checksCount={checksCount}
				page={page}
				setPage={setPage}
				rowsPerPage={rowsPerPage}
				setRowsPerPage={setRowsPerPage}
			/>
		</BasePage>
	);
};

export default Checks;
