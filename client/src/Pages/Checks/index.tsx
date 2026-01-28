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

import { MenuItem, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useGet } from "@/Hooks/UseApi";
import type { Monitor } from "@/Types/Monitor";
import type { ChecksSummary } from "@/Types/Check";

const Checks = () => {
	const { t } = useTranslation();
	const { monitorId } = useParams<{ monitorId?: string }>();

	// Local state
	const [selectedMonitor, setSelectedMonitor] = useState<string>(monitorId || "0");
	const [dateRange, setDateRange] = useState<string>("recent");
	const [statusFilter, setStatusFilter] = useState<string>("down");
	const [page, setPage] = useState<number>(0);
	const [rowsPerPage, setRowsPerPage] = useState<number>(10);

	// Data fetching with SWR
	const monitorsUrl = "/monitors/team";
	const summaryUrl = `/checks/team/summary?dateRange=${dateRange}`;

	const { data: monitorsResponse, isLoading: isLoadingMonitors } =
		useGet<Monitor[]>(monitorsUrl);

	const { data: summaryResponse, isLoading: isLoadingSummary } =
		useGet<ChecksSummary>(summaryUrl);

	const isLoading = isLoadingMonitors || isLoadingSummary;
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
				justifyContent={"space-between"}
				alignItems={"center"}
				gap={2}
			>
				<Stack
					direction="row"
					gap={2}
				>
					<Select
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
					isLoading={isLoading}
					dateRange={dateRange}
					setDateRange={setDateRange}
				/>
			</Stack>

			<ChecksTable
				monitors={monitorsResponse ?? null}
				selectedMonitorId={selectedMonitor}
				statusFilter={statusFilter}
				dateRange={dateRange}
				page={page}
				setPage={setPage}
				rowsPerPage={rowsPerPage}
				setRowsPerPage={setRowsPerPage}
			/>
		</BasePage>
	);
};

export default Checks;
