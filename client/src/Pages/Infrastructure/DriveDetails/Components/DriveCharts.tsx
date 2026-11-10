import Grid from "@mui/material/Grid";
import { HistogramInfrastructure } from "@/Components/monitors";

import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { DriveHistoryPoint, LatestDrive } from "@/Types/Monitor";
import { isNvme } from "@/Utils/StorageUtils";

const TEMPERATURE_HEADROOM = 1.3;
const formatCount = (value: number) => value.toFixed(0);
const formatTemp = (value: number) => `${value.toFixed(0)}°C`;

// The drive's main failure counter and its temperature over the selected range
export const DriveCharts = ({
	drive,
	points,
	dateRange,
}: {
	drive: LatestDrive;
	points: DriveHistoryPoint[];
	dateRange: string;
}) => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const { t } = useTranslation();

	const maxTemperature = points.reduce(
		(max, point) =>
			point.temperature !== null && point.temperature > max ? point.temperature : max,
		0
	);
	const temperatureDomain = [
		0,
		Math.ceil((maxTemperature * TEMPERATURE_HEADROOM) / 10) * 10 || 100,
	];
	const nvme = isNvme(drive);

	const charts = [
		{
			type: "counter",
			title: nvme
				? t("pages.infrastructure.drive.charts.mediaErrors")
				: t("pages.infrastructure.drive.charts.reallocated"),
			dataKey: nvme ? "media_errors" : "reallocated_sectors",
			color: theme.palette.error.main,
			yDomain: undefined,
			formatter: formatCount,
		},
		{
			type: "temperature",
			title: t("pages.infrastructure.drive.charts.temperature"),
			dataKey: "temperature",
			color: theme.palette.primary.main,
			yDomain: temperatureDomain,
			formatter: formatTemp,
		},
	];

	return (
		<Grid
			container
			spacing={theme.spacing(8)}
		>
			{charts.map((chart) => (
				<Grid
					size={isSmall ? 12 : 6}
					key={chart.type}
				>
					<HistogramInfrastructure
						dateRange={dateRange}
						title={chart.title}
						type={chart.type}
						idx={null}
						checks={points}
						xKey="bucketDate"
						yDomain={chart.yDomain}
						dataKeys={[chart.dataKey]}
						gradient={true}
						gradientStartColor={chart.color}
						gradientEndColor={theme.palette.background.paper}
						strokeColor={chart.color}
						yAxisFormatter={chart.formatter}
					/>
				</Grid>
			))}
		</Grid>
	);
};
