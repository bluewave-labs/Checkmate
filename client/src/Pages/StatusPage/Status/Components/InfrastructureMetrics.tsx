import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Gauge } from "@/Components/design-elements";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import prettyBytes from "pretty-bytes";
import type { Monitor } from "@/Types/Monitor";

interface StatusPageMonitor extends Monitor {
	checks?: Monitor["recentChecks"];
	infrastructureCPU?: number;
	infrastructureMemory?: number;
	infrastructureDisk?: number;
}

interface MetricItemProps {
	label: string;
	progress: number;
	upperLabel?: string;
	upperValue?: string;
	lowerLabel?: string;
	lowerValue?: string;
}

const MetricItem = ({
	label,
	progress,
	upperLabel,
	upperValue,
	lowerLabel,
	lowerValue,
}: MetricItemProps) => {
	const theme = useTheme();
	return (
		<Stack
			direction="row"
			alignItems="center"
			gap={`${theme.spacing(4)} ${theme.spacing(10)}`}
			flex={1}
		>
			<Stack
				alignItems="center"
				spacing={theme.spacing(2)}
			>
				<Gauge
					progress={progress}
					radius={60}
					strokeWidth={12}
				/>
				<Typography variant="body2">{label}</Typography>
			</Stack>
			{(upperLabel || lowerLabel) && (
				<Stack
					spacing={theme.spacing(1)}
					flex={1}
					paddingBottom={theme.spacing(10)}
				>
					{upperLabel && (
						<Stack
							direction="row"
							justifyContent="space-between"
						>
							<Typography
								variant="body2"
								color="text.secondary"
							>
								{upperLabel}
							</Typography>
							<Typography variant="body2">{upperValue}</Typography>
						</Stack>
					)}
					{lowerLabel && (
						<Stack
							direction="row"
							justifyContent="space-between"
						>
							<Typography
								variant="body2"
								color="text.secondary"
							>
								{lowerLabel}
							</Typography>
							<Typography variant="body2">{lowerValue}</Typography>
						</Stack>
					)}
				</Stack>
			)}
		</Stack>
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
				color="text.secondary"
			>
				{t("pages.statusPages.monitorsList.noData")}
			</Typography>
		);
	}

	const cpuUsage = (latestCheck?.cpu?.usage_percent || 0) * 100;
	const memoryUsage = (latestCheck?.memory?.usage_percent || 0) * 100;
	const memoryUsed = latestCheck?.memory?.used_bytes || 0;
	const memoryTotal = latestCheck?.memory?.total_bytes || 0;

	const disks = latestCheck?.disk ?? [];
	const totalDiskUsage = disks.reduce((acc, disk) => acc + (disk?.usage_percent || 0), 0);
	const diskCount = disks.length || 1;
	const diskUsage = (totalDiskUsage / diskCount) * 100;
	const diskUsed = disks.reduce((acc, disk) => acc + (disk?.used_bytes || 0), 0);
	const diskTotal = disks.reduce((acc, disk) => acc + (disk?.total_bytes || 0), 0);

	return (
		<Stack
			direction={{ xs: "column", sm: "row" }}
			gap={theme.spacing(10)}
			columnGap={theme.spacing(15)}
			padding={theme.spacing(8)}
		>
			<MetricItem
				label={t("pages.statusPages.monitorsList.infrastructure.cpu")}
				progress={cpuUsage}
				upperLabel={t("pages.statusPages.monitorsList.infrastructure.usage")}
				upperValue={`${cpuUsage.toFixed(1)}%`}
			/>
			<MetricItem
				label={t("pages.statusPages.monitorsList.infrastructure.memory")}
				progress={memoryUsage}
				upperLabel={t("pages.statusPages.monitorsList.infrastructure.used")}
				upperValue={prettyBytes(memoryUsed)}
				lowerLabel={t("pages.statusPages.monitorsList.infrastructure.total")}
				lowerValue={prettyBytes(memoryTotal)}
			/>
			<MetricItem
				label={t("pages.statusPages.monitorsList.infrastructure.disk")}
				progress={diskUsage}
				upperLabel={t("pages.statusPages.monitorsList.infrastructure.used")}
				upperValue={prettyBytes(diskUsed)}
				lowerLabel={t("pages.statusPages.monitorsList.infrastructure.total")}
				lowerValue={prettyBytes(diskTotal)}
			/>
		</Stack>
	);
};
