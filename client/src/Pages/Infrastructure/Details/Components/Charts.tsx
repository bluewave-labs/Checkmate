import Grid from "@mui/material/Grid";
import { HistogramInfrastructure } from "@/Components/v2/monitors";

import { useTranslation } from "react-i18next";
import type { HardwareCheckStats } from "@/Types/Monitor";
import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

const getChartConfigs = (theme: any, checks: HardwareCheckStats[], t: any) => {
	return [
		{
			title: t("pages.infrastructure.charts.labels.memory"),
			type: "memory",
			dataKeys: ["avgMemoryUsage"],
			strokeColor: theme.palette.primary.main,
			gradientStartColor: theme.palette.primary.main,
			yDomain: [0, 1],
			idx: null,
		},
		{
			title: t("pages.infrastructure.charts.labels.cpu"),
			type: "cpu",
			dataKeys: ["avgCpuUsage"],
			strokeColor: theme.palette.success.main,
			gradientStartColor: theme.palette.success.main,
			yDomain: [0, 1],
			idx: null,
		},
		{
			title: t("pages.infrastructure.charts.labels.temp"),
			type: "temp",
			dataKeys: ["avg_temp"],
			strokeColor: theme.palette.error.main,
			gradientStartColor: theme.palette.error.main,
			yDomain: [0, 150],
			idx: null,
		},
		...(checks[0]?.disks?.map((_, idx) => ({
			title: t("pages.infrastructure.charts.labels.disk", { idx }),
			type: "disk",
			dataKeys: [`disks[${idx}].usagePercent`],
			strokeColor: theme.palette.warning.main,
			gradientStartColor: theme.palette.warning.main,
			yDomain: [0, 1],
			idx,
		})) || []),
	];
};

export const InfraDetailsCharts = ({
	checks,
	range,
}: {
	checks: HardwareCheckStats[];
	range: string;
}) => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const { t } = useTranslation();
	const chartConfigs = useMemo(
		() => getChartConfigs(theme, checks, t),
		[theme, checks, t]
	);

	console.log(checks);
	return (
		<Grid
			container
			spacing={theme.spacing(8)}
		>
			{chartConfigs.map((config) => {
				return (
					<Grid
						size={isSmall ? 12 : 6}
						key={`${config.type}-${config.idx ?? ""}`}
					>
						<HistogramInfrastructure
							range={range}
							title={config.title}
							type={config.type}
							idx={config.idx}
							key={`${config.type}-${config.idx ?? ""}`}
							checks={checks}
							xKey="bucketDate"
							yDomain={config.yDomain}
							dataKeys={config.dataKeys}
							gradient={true}
							gradientStartColor={config.gradientStartColor}
							gradientEndColor="#ffffff"
							strokeColor={config.strokeColor}
						/>
					</Grid>
				);
			})}
		</Grid>
	);
};
