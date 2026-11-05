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

export const DiagnosticCard = () => {
	const {
		data: diagnostics,
		isLoading: _isLoading,
		error: _error,
		refetch: _refetch,
	} = useGet<Diagnostics>("/diagnostic/system", {}, { refreshInterval: 30000 });

	const theme = useTheme();
	const { t } = useTranslation();
	const { versionInfo } = useAppVersion();
	const showUpdate = Boolean(versionInfo?.updateAvailable && versionInfo.latest);
	const latestLabel = versionInfo?.latest && formatVersion(versionInfo.latest);

	if (!diagnostics) return null;
	const usedHeap = diagnostics.v8HeapStats.usedHeapSizeBytes;
	const heapLimit = diagnostics.v8HeapStats.heapSizeLimitBytes;
	const cpuUSage = diagnostics.cpuUsage;
	const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
		return (
			<Stack
				direction={{ xs: "column", md: "row" }}
				justifyContent="space-between"
				gap={{ xs: theme.spacing(LAYOUT.XS), md: 0 }}
			>
				<Typography fontWeight={{ xs: 500, md: "normal" }}>{label}</Typography>
				<Typography>{value}</Typography>
			</Stack>
		);
	};

	return (
		<DashboardCard title={t("pages.dashboard.cards.diagnostic")}>
			<Stack gap={theme.spacing(LAYOUT.SM)}>
				<InfoRow
					label={t("pages.dashboard.diagnostic.version")}
					value={
						<>
							{formatVersion(__APP_VERSION__)}
							{showUpdate && (
								<Box
									component="span"
									ml={theme.spacing(LAYOUT.SM)}
									color={theme.palette.text.secondary}
								>
									{t("pages.dashboard.diagnostic.updateAvailable", {
										version: latestLabel,
									})}
								</Box>
							)}
						</>
					}
				/>
				<BarRow
					label={t("pages.dashboard.diagnostic.heapUsage")}
					value={
						<Typography
							color={getSeverityColor(usedHeap / heapLimit, theme)}
						>{`${prettyBytes(usedHeap)} / ${prettyBytes(heapLimit)}`}</Typography>
					}
					fillRatio={usedHeap / heapLimit}
				/>
				<BarRow
					label={t("pages.dashboard.diagnostic.cpuUsage")}
					value={
						<Typography color={getSeverityColor(cpuUSage.usagePercentage, theme)}>
							{formatPercentage(cpuUSage.usagePercentage)}
						</Typography>
					}
					fillRatio={cpuUSage.usagePercentage}
				/>
				<InfoRow
					label={t("pages.dashboard.diagnostic.eventLoopDelay")}
					value={formatMs(diagnostics.eventLoopDelayMs)}
				/>
				<InfoRow
					label={t("pages.dashboard.diagnostic.dbSize")}
					value={prettyBytes(diagnostics.mongoStats.totalSize)}
				/>
				<InfoRow
					label={t("pages.dashboard.diagnostic.dbOperations")}
					value={t("pages.dashboard.diagnostic.dbOperationsSummary", {
						reads: diagnostics.mongoStats.readsPerSecond.toFixed(1),
						writes: diagnostics.mongoStats.writesPerSecond.toFixed(1),
					})}
				/>
			</Stack>
		</DashboardCard>
	);
};
