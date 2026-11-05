import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { DashboardCard } from "@/Pages/Dashboard/components/DashboardCard";

import { useGet } from "@/Hooks/UseApi";
import type { Diagnostics } from "@/Types/Diagnostics";
import { LAYOUT } from "@/Utils/Theme/constants";
import { Typography, useTheme } from "@mui/material";
import { BarRow } from "@/Pages/Dashboard/components/cards/BarRow";
import prettyBytes from "pretty-bytes";
import { getSeverityColor } from "@/Utils/MonitorUtils";
import { formatMs } from "@/Utils/TimeUtils";
import { formatPercentage, formatVersion } from "@/Utils/FormatUtils";
import { useAppVersion } from "@/Hooks/useAppVersion";
import { useTranslation } from "react-i18next";
import type { QueueMetrics } from "@/Types/Queue";

export const DiagnosticCard = () => {
	const {
		data: diagnostics,
		isLoading: _isLoading,
		error: _error,
		refetch: _refetch,
	} = useGet<Diagnostics>("/diagnostic/system", {}, { refreshInterval: 30000 });

	const { data: queueMetrics } = useGet<QueueMetrics>(
		"/queue/metrics",
		{},
		{ refreshInterval: 30000, keepPreviousData: true }
	);
	const theme = useTheme();
	const { t } = useTranslation();
	const { versionInfo } = useAppVersion();
	const showUpdate = Boolean(versionInfo?.updateAvailable && versionInfo.latest);
	const latestLabel = versionInfo?.latest && formatVersion(versionInfo.latest);

	if (!diagnostics) return null;
	const usedHeap = diagnostics.v8HeapStats.usedHeapSizeBytes;
	const heapLimit = diagnostics.v8HeapStats.heapSizeLimitBytes;
	const cpuUSage = diagnostics.cpuUsage;
	// Half the row so stacked StatGrids line up; full width under the heading on small screens.
	const StatGrid = ({ children }: { children: React.ReactNode }) => (
		<Box
			display="grid"
			gridTemplateColumns="1fr auto"
			columnGap={theme.spacing(LAYOUT.MD)}
			width={{ xs: "100%", md: "50%" }}
		>
			{children}
		</Box>
	);
	const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
		return (
			<Stack
				direction={{ xs: "column", md: "row" }}
				justifyContent="space-between"
				gap={{ xs: theme.spacing(LAYOUT.XS), md: 0 }}
			>
				<Typography fontWeight={{ xs: 500, md: "normal" }}>{label}</Typography>
				{typeof value === "string" || typeof value === "number" ? (
					<Typography>{value}</Typography>
				) : (
					value
				)}
			</Stack>
		);
	};

	return (
		<DashboardCard title="Checkmate">
			<Stack gap={theme.spacing(LAYOUT.SM)}>
				<InfoRow
					label="Version"
					value={
						<Stack
							direction="row"
							alignItems="center"
							gap={theme.spacing(LAYOUT.SM)}
						>
							<Typography>{formatVersion(__APP_VERSION__)}</Typography>
							{showUpdate && (
								<Typography color={theme.palette.text.secondary}>
									{t("components.pageHeader.update.available", {
										version: latestLabel,
									})}
								</Typography>
							)}
						</Stack>
					}
				/>
				<BarRow
					label="Heap usage"
					value={
						<Typography
							color={getSeverityColor(usedHeap / heapLimit, theme)}
						>{`${prettyBytes(usedHeap)} / ${prettyBytes(heapLimit)}`}</Typography>
					}
					fillRatio={usedHeap / heapLimit}
				/>
				<BarRow
					label="CPU usage"
					value={
						<Typography color={getSeverityColor(cpuUSage.usagePercentage, theme)}>
							{formatPercentage(cpuUSage.usagePercentage)}
						</Typography>
					}
					fillRatio={cpuUSage.usagePercentage}
				/>
				<InfoRow
					label="Event loop delay"
					value={formatMs(diagnostics.eventLoopDelayMs)}
				/>
				{queueMetrics && (
					<InfoRow
						label="Workers"
						value={
							<StatGrid>
								<Typography>{"Alive:"}</Typography>
								<Typography
									textAlign="right"
									color={
										queueMetrics.workers.length === 0
											? theme.palette.error.main
											: theme.palette.success.main
									}
								>
									{queueMetrics.workers.length}
								</Typography>
								<Typography>{"Failing jobs:"}</Typography>
								<Typography
									textAlign="right"
									color={getSeverityColor(
										queueMetrics.jobs ? queueMetrics.failingJobs / queueMetrics.jobs : 0,
										theme
									)}
								>{`${queueMetrics.failingJobs} / ${queueMetrics.jobs}`}</Typography>
							</StatGrid>
						}
					/>
				)}
				<InfoRow
					label="Database"
					value={
						<StatGrid>
							<Typography>{"DB size:"}</Typography>
							<Typography textAlign="right">
								{prettyBytes(diagnostics.mongoStats.totalSize)}
							</Typography>
							<Typography>{`${diagnostics.mongoStats.readsPerSecond.toFixed(1)} reads/s`}</Typography>
							<Typography textAlign="right">{`${diagnostics.mongoStats.writesPerSecond.toFixed(1)} writes/s`}</Typography>
							<Typography>{`${diagnostics.mongoStats.updatesPerSecond.toFixed(1)} update/s`}</Typography>
							<Typography textAlign="right">{`${diagnostics.mongoStats.deletesPerSecond.toFixed(1)} delete/s`}</Typography>
						</StatGrid>
					}
				/>
			</Stack>
		</DashboardCard>
	);
};
