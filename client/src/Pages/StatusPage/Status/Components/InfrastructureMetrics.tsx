import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Gauge } from "@/Components/design-elements";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import prettyBytes from "pretty-bytes";
import type { Monitor } from "@/Types/Monitor";
import Grid from "@mui/material/Grid";
import useMediaQuery from "@mui/material/useMediaQuery";
import Box from "@mui/material/Box";
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";

const GAUGE_RADIUS = 60;
const GAUGE_STROKE_WIDTH = 12;
const PERCENTAGE_MULTIPLIER = 100;

interface StatusPageMonitor extends Monitor {
	checks?: Monitor["recentChecks"];
}

interface MetricDetail {
	label: string;
	value: string;
}

interface MetricConfig {
	key: string;
	label: string;
	hasData: boolean;
	progress: number;
	details: MetricDetail[];
}

const MetricDetailRow = ({ label, value }: MetricDetail) => {
	const theme = useTheme();
	return (
		<Stack
			direction="row"
			justifyContent="space-between"
		>
			<Typography
				variant="body2"
				color={theme.palette.text.secondary}
			>
				{label}
			</Typography>
			<Typography variant="body2">{value}</Typography>
		</Stack>
	);
};

interface MetricItemProps {
	label: string;
	progress: number;
	details?: MetricDetail[];
}

const MetricItem = ({ label, progress, details }: MetricItemProps) => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	return (
		<Grid
			size={isSmall ? 12 : 4}
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				textAlign: "center",
				gap: theme.spacing(SPACING.LG),
				padding: theme.spacing(LAYOUT.XS),
				borderRight: isSmall ? "none" : `1px solid ${theme.palette.divider}`,
				borderBottom: isSmall ? `1px solid ${theme.palette.divider}` : "none",
				"&:last-child": {
					borderRight: "none",
					borderBottom: "none",
					paddingBottom: theme.spacing(SPACING.LG),
				},
			}}
		>
			<Box
				display="flex"
				flexDirection="column"
				alignItems="center"
			>
				<Gauge
					progress={progress}
					radius={GAUGE_RADIUS}
					strokeWidth={GAUGE_STROKE_WIDTH}
				/>
				<Typography variant="body2">{label}</Typography>
			</Box>
			{details && details.length > 0 && (
				<Box
					width="100%"
					paddingX={theme.spacing(LAYOUT.LG)}
				>
					{details.map((detail) => (
						<MetricDetailRow
							key={detail.label}
							label={detail.label}
							value={detail.value}
						/>
					))}
				</Box>
			)}
		</Grid>
	);
};

type LatestCheck = NonNullable<Monitor["recentChecks"]>[number];

const buildCpuMetric = (
	check: LatestCheck,
	t: (key: string) => string
): MetricConfig | null => {
	if (!check.cpu || typeof check.cpu.usage_percent !== "number") {
		return null;
	}
	const usagePercent = (check.cpu.usage_percent ?? 0) * PERCENTAGE_MULTIPLIER;
	return {
		key: "cpu",
		label: t("pages.statusPages.monitorsList.infrastructure.cpu"),
		hasData: true,
		progress: usagePercent,
		details: [
			{
				label: t("pages.statusPages.monitorsList.infrastructure.usage"),
				value: `${usagePercent.toFixed(2)}%`,
			},
		],
	};
};

const buildMemoryMetric = (
	check: LatestCheck,
	t: (key: string) => string
): MetricConfig | null => {
	if (
		!check.memory ||
		typeof check.memory.usage_percent !== "number" ||
		typeof check.memory.used_bytes !== "number" ||
		typeof check.memory.total_bytes !== "number"
	) {
		return null;
	}
	return {
		key: "memory",
		label: t("pages.statusPages.monitorsList.infrastructure.memory"),
		hasData: true,
		progress: (check.memory.usage_percent ?? 0) * PERCENTAGE_MULTIPLIER,
		details: [
			{
				label: t("pages.statusPages.monitorsList.infrastructure.used"),
				value: prettyBytes(check.memory.used_bytes ?? 0),
			},
			{
				label: t("pages.statusPages.monitorsList.infrastructure.total"),
				value: prettyBytes(check.memory.total_bytes ?? 0),
			},
		],
	};
};

const buildDiskMetric = (
	check: LatestCheck,
	t: (key: string) => string
): MetricConfig | null => {
	if (!check.disk || check.disk.length === 0) {
		return null;
	}
	const disks = check.disk;
	const avgUsagePercent =
		(disks.reduce((acc, disk) => acc + (disk?.usage_percent ?? 0), 0) / disks.length) *
		PERCENTAGE_MULTIPLIER;
	const totalUsedBytes = disks.reduce((acc, disk) => acc + (disk?.used_bytes ?? 0), 0);
	const totalTotalBytes = disks.reduce((acc, disk) => acc + (disk?.total_bytes ?? 0), 0);

	return {
		key: "disk",
		label: t("pages.statusPages.monitorsList.infrastructure.disk"),
		hasData: true,
		progress: avgUsagePercent,
		details: [
			{
				label: t("pages.statusPages.monitorsList.infrastructure.used"),
				value: prettyBytes(totalUsedBytes),
			},
			{
				label: t("pages.statusPages.monitorsList.infrastructure.total"),
				value: prettyBytes(totalTotalBytes),
			},
		],
	};
};

export const InfrastructureMetrics = ({ monitor }: { monitor: StatusPageMonitor }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const latestCheck = monitor.recentChecks?.[0] ?? monitor.checks?.[0];

	if (!latestCheck) {
		return (
			<Typography
				variant="body2"
				color={theme.palette.text.secondary}
			>
				{t("pages.statusPages.monitorsList.noData")}
			</Typography>
		);
	}

	const metrics: MetricConfig[] = [
		buildCpuMetric(latestCheck, t),
		buildMemoryMetric(latestCheck, t),
		buildDiskMetric(latestCheck, t),
	].filter((m): m is MetricConfig => m !== null);

	if (metrics.length === 0) {
		return (
			<Typography
				variant="body2"
				color={theme.palette.text.secondary}
			>
				{t("pages.statusPages.monitorsList.noData")}
			</Typography>
		);
	}

	return (
		<Grid
			container
			alignItems="center"
			padding={theme.spacing(LAYOUT.XS)}
		>
			{metrics.map(({ key, label, progress, details }) => (
				<MetricItem
					key={key}
					label={label}
					progress={progress}
					details={details}
				/>
			))}
		</Grid>
	);
};
