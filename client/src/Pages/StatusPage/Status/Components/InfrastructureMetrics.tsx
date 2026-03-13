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

interface StatusPageMonitor extends Monitor {
	checks?: Monitor["recentChecks"];
	infrastructureCPU?: number;
	infrastructureMemory?: number;
	infrastructureDisk?: number;
}

interface MetricDetailRowProps {
	label: string;
	value: string;
}

const MetricDetailRow = ({ label, value }: MetricDetailRowProps) => {
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
	details?: MetricDetailRowProps[];
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
					radius={60}
					strokeWidth={12}
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

	const metrics = [
		{
			key: t("pages.statusPages.monitorsList.infrastructure.cpu"),
			labelKey: t("pages.statusPages.monitorsList.infrastructure.cpu"),
			hasData: latestCheck.cpu && typeof latestCheck.cpu.usage_percent === "number",
			progress: latestCheck.cpu?.usage_percent ? latestCheck.cpu.usage_percent * 100 : 0,
			details: [
				{
					label: t("pages.statusPages.monitorsList.infrastructure.usage"),
					value: `${((latestCheck.cpu?.usage_percent || 0) * 100).toFixed(2)}%`,
				},
			],
		},
		{
			key: t("pages.statusPages.monitorsList.infrastructure.memoryText"),
			labelKey: t("pages.statusPages.monitorsList.infrastructure.memory"),
			hasData:
				latestCheck.memory &&
				typeof latestCheck.memory.usage_percent === "number" &&
				typeof latestCheck.memory.used_bytes === "number" &&
				typeof latestCheck.memory.total_bytes === "number",
			progress: latestCheck.memory?.usage_percent
				? latestCheck.memory.usage_percent * 100
				: 0,
			details: [
				{
					label: t("pages.statusPages.monitorsList.infrastructure.used"),
					value: prettyBytes(latestCheck.memory?.used_bytes || 0),
				},
				{
					label: t("pages.statusPages.monitorsList.infrastructure.total"),
					value: prettyBytes(latestCheck.memory?.total_bytes || 0),
				},
			],
		},
		{
			key: t("pages.statusPages.monitorsList.infrastructure.disk"),
			labelKey: t("pages.statusPages.monitorsList.infrastructure.disk"),
			hasData: latestCheck.disk && latestCheck.disk.length > 0,
			progress: latestCheck.disk
				? (latestCheck.disk.reduce((acc, disk) => acc + (disk?.usage_percent || 0), 0) /
						latestCheck.disk.length) *
					100
				: 0,
			details: [
				{
					label: t("pages.statusPages.monitorsList.infrastructure.used"),
					value: prettyBytes(
						latestCheck?.disk?.reduce((acc, disk) => acc + (disk?.used_bytes || 0), 0) ??
							0
					),
				},
				{
					label: t("pages.statusPages.monitorsList.infrastructure.total"),
					value: prettyBytes(
						latestCheck?.disk?.reduce((acc, disk) => acc + (disk?.total_bytes || 0), 0) ??
							0
					),
				},
			],
		},
	];

	return (
		<Grid
			container
			alignItems="center"
			padding={theme.spacing(LAYOUT.XS)}
		>
			{metrics.map(
				({ key, labelKey, hasData, progress, details }) =>
					hasData && (
						<MetricItem
							key={key}
							label={t(labelKey)}
							progress={progress}
							details={details}
						/>
					)
			)}
		</Grid>
	);
};
