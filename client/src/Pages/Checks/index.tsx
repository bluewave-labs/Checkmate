import Stack from "@mui/material/Stack";
import { BasePage, TotalChecksBox, DownChecksBox } from "@/Components/v2/design-elements";

import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useGet } from "@/Hooks/UseApi";
import type { Monitor } from "@/Types/Monitor";
import type { ChecksSummary } from "@/Types/Check";

const Checks = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const { monitorId } = useParams<{ monitorId?: string }>();

	// Local state
	const [selectedMonitor, setSelectedMonitor] = useState<string>("0");
	const [filter, setFilter] = useState<boolean | undefined>(undefined);
	const [dateRange, setDateRange] = useState<string>("hour");

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

	console.log(monitorsResponse, summaryResponse);

	return (
		<BasePage>
			<Stack
				direction={{ xs: "column", md: "row" }}
				gap={4}
			>
				<TotalChecksBox n={summaryResponse?.totalChecks || 0} />
				<DownChecksBox n={summaryResponse?.downChecks || 0} />
			</Stack>
		</BasePage>
	);
};

export default Checks;
