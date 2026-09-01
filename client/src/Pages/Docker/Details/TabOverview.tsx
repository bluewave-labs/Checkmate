// Components
import Grid from "@mui/material/Grid";
import { HistogramDockerContainer } from "@/Components/monitors/charts/HistogramDockerContainer";

// Hooks
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import useMediaQuery from "@mui/material/useMediaQuery";

// Types
import type { Theme } from "@mui/material";
import type { TFunction } from "i18next";
import type { DockerContainerStats } from "@/Types/Monitor";
import { LAYOUT } from "@/Utils/Theme/constants";
import { formatPercentage } from "@/Utils/FormatUtils";
import prettyBytes from "pretty-bytes";

const getChartConfigs = (theme: Theme, t: TFunction, stats: DockerContainerStats) => [
	{
		title: t("common.charts.labels.cpuUsage"),
		key: "avgCpuPct",
		color: theme.palette.success.main,
		rightTitle: formatPercentage(stats?.latest?.container.cpuPct || 0),
	},
	{
		title: t("common.charts.labels.memoryUsage"),
		key: "avgMemoryUsedBytes",
		color: theme.palette.primary.main,
		rightTitle: prettyBytes(stats?.latest?.container.memoryUsedBytes || 0),
	},
];

export const TabOverview = ({ stats }: { stats: DockerContainerStats }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));

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
						/>
					</Grid>
				);
			})}
		</Grid>
	);
};
