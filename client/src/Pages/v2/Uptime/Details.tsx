import { BasePage } from "@/Components/v2/DesignElements";
import { HeaderControls } from "@/Components/v2/Monitors/HeaderControls";
import Stack from "@mui/material/Stack";
import { StatBox } from "@/Components/v2/DesignElements";
import { HistogramStatus } from "@/Components/v2/Monitors/HistogramStatus";
import { ChartAvgResponse } from "@/Components/v2/Monitors/ChartAvgResponse";

import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useParams } from "react-router";
import { useGet, usePatch, type ApiResponse } from "@/Hooks/v2/UseApi";
import { useState } from "react";
import { getStatusPalette } from "@/Utils/MonitorUtils";
import prettyMilliseconds from "pretty-ms";
import { ChartResponseTime } from "@/Components/v2/Monitors/ChartResponseTime";

const UptimeDetailsPage = () => {
	const { id } = useParams();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));

	// Local state
	const [range, setRange] = useState("2h");

	const { response, loading, error, refetch } = useGet<ApiResponse>(
		`/monitors/${id}?embedChecks=true&range=${range}`,

		{},
		{ refreshInterval: 30000 }
	);

	const {
		response: upResponse,
		error: upError,
		loading: upLoading,
	} = useGet<ApiResponse>(
		`/monitors/${id}?embedChecks=true&range=${range}&status=up`,
		{},
		{}
	);

	const {
		response: downResponse,
		error: downError,
		loading: downLoading,
	} = useGet<ApiResponse>(
		`/monitors/${id}?embedChecks=true&range=${range}&status=down`,
		{},
		{}
	);

	const {
		patch,
		loading: isPatching,
		error: postError,
	} = usePatch<ApiResponse>(`/monitors/${id}/active`);

	const monitor = response?.data?.monitor || null;
	if (!monitor) {
		return null;
	}

	const stats = response?.data?.stats || null;
	const avgResponseTime = stats?.avgResponseTime || 0;
	const maxResponseTime = stats?.maxResponseTime || 0;

	const streakDuration = stats?.currentStreakStartedAt
		? Date.now() - stats?.currentStreakStartedAt
		: 0;

	const lastChecked = stats?.lastCheckTimestamp
		? Date.now() - stats?.lastCheckTimestamp
		: -1;

	const checks = response?.data?.checks || [];
	const upChecks = upResponse?.data?.checks || [];
	const downChecks = downResponse?.data?.checks || [];

	// TODO something with these

	console.log(loading, error, postError, checks, setRange);

	const palette = getStatusPalette(monitor.status);

	return (
		<BasePage>
			<HeaderControls
				monitor={monitor}
				patch={patch}
				isPatching={isPatching}
				refetch={refetch}
			/>
			<Stack
				direction="row"
				gap={theme.spacing(8)}
			>
				<StatBox
					palette={palette}
					title="Active for"
					subtitle={prettyMilliseconds(streakDuration, { secondsDecimalDigits: 0 })}
				/>
				<StatBox
					title="Last check"
					subtitle={
						lastChecked >= 0
							? `${prettyMilliseconds(lastChecked, { secondsDecimalDigits: 0 })} ago`
							: "N/A"
					}
				/>
				<StatBox
					title="Last response time"
					subtitle={stats?.lastResponseTime ? `${stats?.lastResponseTime} ms` : "N/A"}
				/>
			</Stack>
			<Stack
				direction={isSmall ? "column" : "row"}
				gap={theme.spacing(8)}
			>
				<HistogramStatus
					title="Uptime"
					status={"up"}
					checks={upChecks.reverse()}
					range={range}
				/>
				<HistogramStatus
					title="Incidents"
					checks={downChecks.reverse()}
					status={"down"}
					range={range}
				/>
				<ChartAvgResponse
					avg={avgResponseTime}
					max={maxResponseTime}
				/>
			</Stack>
			<ChartResponseTime
				checks={checks}
				range={range}
			/>
		</BasePage>
	);
};

export default UptimeDetailsPage;
