import Stack from "@mui/material/Stack";
import { BasePage, TotalChecksBox, DownChecksBox } from "@/Components/v2/design-elements";
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
	const theme = useTheme();
	const { monitorId } = useParams<{ monitorId?: string }>();

	// Local state
	const [selectedMonitor, setSelectedMonitor] = useState<string>(monitorId || "0");
	const [dateRange, setDateRange] = useState<string>("recent");
	const [page, setPage] = useState<number>(0);
	const [rowsPerPage, setRowsPerPage] = useState<number>(10);

	// Data fetching with SWR
	const monitorsUrl = "/monitors/team";
	const summaryUrl = `/checks/team/summary?dateRange=${dateRange}`;

	const {
		data: monitorsResponse,
		isLoading: isLoadingMonitors,
		error: monitorsError,
	} = useGet<Monitor[]>(monitorsUrl);

	const {
		data: summaryResponse,
		isLoading: isLoadingSummary,
		error: summaryError,
	} = useGet<ChecksSummary>(summaryUrl);

	return (
		<BasePage>
			<Stack
				direction={{ xs: "column", md: "row" }}
				gap={4}
			>
				<TotalChecksBox n={summaryResponse?.totalChecks || 0} />
				<DownChecksBox n={summaryResponse?.downChecks || 0} />
			</Stack>

			<Stack
				direction={{ xs: "column", md: "row" }}
				justifyContent={"space-between"}
				alignItems={"center"}
			>
				<Select
					value={selectedMonitor}
					onChange={(e: any) => {
						setSelectedMonitor(e.target.value);
					}}
				>
					<MenuItem value="0">All monitors</MenuItem>
					{monitorsResponse?.map((monitor) => (
						<MenuItem
							key={monitor.id}
							value={monitor.id}
						>
							{monitor.name}
						</MenuItem>
					))}
				</Select>
				<HeaderTimeRange
					dateRange={dateRange}
					setDateRange={setDateRange}
				/>
			</Stack>

			<ChecksTable
				monitors={monitorsResponse ?? null}
				selectedMonitorId={selectedMonitor}
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
