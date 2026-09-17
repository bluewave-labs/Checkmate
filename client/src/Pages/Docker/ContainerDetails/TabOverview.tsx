// Components
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import { HistogramDockerContainer } from "@/Components/monitors/charts/HistogramDockerContainer";

// Hooks
import { Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import useMediaQuery from "@mui/material/useMediaQuery";

// Types
import type { Theme } from "@mui/material";
import type { TFunction } from "i18next";
import type { DockerContainerStats } from "@/Types/Monitor";
import { LAYOUT } from "@/Utils/Theme/constants";
import { formatPercentage } from "@/Utils/FormatUtils";
import prettyBytes from "pretty-bytes";
import { BaseBox } from "@/Components/design-elements";
import { dedupeDockerPorts, getDockerMountLabel } from "@/Utils/MonitorUtils";
import type { DateRange } from "@/Types/Query";

const getChartConfigs = (theme: Theme, t: TFunction, stats: DockerContainerStats) => [
	{
		title: t("common.charts.labels.cpuUsage"),
		key: "avgCpuPct",
		color: theme.palette.success.main,
		rightTitle: formatPercentage(stats?.latest?.container.cpuPct || 0),
		formatter: formatPercentage,
		labelKey: "common.charts.histogram.avgCpuUsage",
	},
	{
		title: t("common.charts.labels.memoryUsage"),
		key: "avgMemoryUsedBytes",
		color: theme.palette.primary.main,
		rightTitle: prettyBytes(stats?.latest?.container.memoryUsedBytes || 0),
		formatter: prettyBytes,
		labelKey: "common.charts.histogram.avgMemoryUsage",
	},
];

export const TabOverview = ({
	stats,
	range,
}: {
	stats: DockerContainerStats;
	range: DateRange;
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const { ports, mounts } = stats?.latest?.container ?? {};
	const dedupedPorts = dedupeDockerPorts(ports ?? []);
	return (
		<Grid
			container
			spacing={LAYOUT.MD}
		>
			{getChartConfigs(theme, t, stats).map((config) => {
				return (
					<Grid
						key={config.key}
						size={isSmall ? 12 : 6}
					>
						<HistogramDockerContainer
							title={config.title}
							rightTitle={config.rightTitle}
							stats={stats}
							dataKey={config.key}
							strokeColor={config.color}
							gradientStartColor={config.color}
							range={range}
							formatter={config.formatter}
							labelKey={config.labelKey}
						/>
					</Grid>
				);
			})}
			<Grid size={isSmall ? 12 : 6}>
				<BaseBox
					padding={LAYOUT.MD}
					minHeight={200}
				>
					<Typography
						variant="eyebrow"
						color={theme.palette.text.secondary}
						textTransform={"uppercase"}
					>
						Ports
					</Typography>
					<Stack>
						{dedupedPorts?.map((port) => {
							return (
								<Typography
									key={`${port.publicPort}/${port.privatePort}`}
								>{`${port.hostIp}:${port.publicPort} -> ${port.privatePort}/${port.protocol}`}</Typography>
							);
						})}
					</Stack>
				</BaseBox>
			</Grid>
			<Grid size={isSmall ? 12 : 6}>
				<BaseBox
					padding={LAYOUT.MD}
					minHeight={200}
				>
					<Typography
						variant="eyebrow"
						color={theme.palette.text.secondary}
						textTransform={"uppercase"}
					>
						Volumes
					</Typography>
					<Stack>
						{mounts?.map((mount) => {
							return (
								<Typography key={`${mount.source}/${mount.destination}`}>
									{`${getDockerMountLabel(mount)} -> ${mount.destination}`}
								</Typography>
							);
						})}
					</Stack>
				</BaseBox>
			</Grid>
		</Grid>
	);
};
