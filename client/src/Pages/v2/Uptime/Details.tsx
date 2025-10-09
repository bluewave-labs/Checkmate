import { BasePage } from "@/Components/v2/DesignElements";
import { HeaderControls } from "@/Components/v2/Monitors/HeaderControls";
import Stack from "@mui/material/Stack";
import { StatBox } from "@/Components/v2/DesignElements";
import { HistogramStatus } from "@/Components/v2/Monitors/HistogramStatus";
import { ChartAvgResponse } from "@/Components/v2/Monitors/ChartAvgResponse";
import { ChartResponseTime } from "@/Components/v2/Monitors/ChartResponseTime";
import { HeaderRange } from "@/Components/v2/Monitors/HeaderRange";
import { CheckTable } from "@/Pages/v2/Uptime/CheckTable";

import type { IMonitor } from "@/Types/Monitor";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useParams } from "react-router";
import { useGet, usePatch, type ApiResponse } from "@/Hooks/v2/UseApi";
import { useState } from "react";
import { getStatusPalette } from "@/Utils/MonitorUtils";
import prettyMilliseconds from "pretty-ms";

const UptimeDetailsPage = () => {
	const { id } = useParams();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));

	// Local state
	const [range, setRange] = useState("2h");

	const { response, isValidating, error, refetch } = useGet<ApiResponse>(
		`/monitors/${id}?embedChecks=true&range=${range}`,

		{},
		{ refreshInterval: 30000, keepPreviousData: true }
	);

	const {
		response: upResponse,
		isValidating: upIsValidating,
		error: upError,
	} = useGet<ApiResponse>(
		`/monitors/${id}?embedChecks=true&range=${range}&status=up`,
		{},
		{ keepPreviousData: true }
	);

	const {
		response: downResponse,
		error: downError,
		isValidating: downIsValidating,
	} = useGet<ApiResponse>(
		`/monitors/${id}?embedChecks=true&range=${range}&status=down`,
		{},
		{ keepPreviousData: true }
	);

	const { patch, loading: isPatching, error: postError } = usePatch<ApiResponse>();

	const monitor: IMonitor = response?.data?.monitor;

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
	const upChecks = upResponse?.data?.checks ? [...upResponse.data.checks].reverse() : [];
	const downChecks = downResponse?.data?.checks
		? [...downResponse.data.checks].reverse()
		: [];

	const palette = getStatusPalette(monitor?.status);

	if (error || upError || downError || postError) {
		console.error("Error fetching monitor data:", {
			error,
			upError,
			downError,
			postError,
		});
	}

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
			<HeaderRange
				loading={isValidating || upIsValidating || downIsValidating}
				range={range}
				setRange={setRange}
			/>
			<Stack
				direction={isSmall ? "column" : "row"}
				gap={theme.spacing(8)}
			>
				<HistogramStatus
					title="Uptime"
					status={"up"}
					checks={upChecks}
					range={range}
				/>
				<HistogramStatus
					title="Incidents"
					checks={downChecks}
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
			<CheckTable monitorId={monitor?._id} />
		</BasePage>
	);
};

export default UptimeDetailsPage;
