import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { BarChart3 } from "lucide-react";
import { BaseChart } from "@/Components/design-elements";
import Typography from "@mui/material/Typography";

import type { CheckSnapshot } from "@/Types/Check";
import { useTranslation } from "react-i18next";
import { getPageSpeedPalette } from "@/Utils/MonitorUtils";
import { useTheme } from "@mui/material/styles";

const MetricBox = ({
	label,
	value,
	weight,
}: {
	label: string;
	value: number;
	weight: number;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const palette = getPageSpeedPalette(value);
	return (
		<Stack
			direction={"row"}
			sx={{
				border: 1,
				borderStyle: "solid",
				borderColor: theme.palette.divider,
				borderRadius: theme.shape.borderRadius,
			}}
		>
			<Stack
				flex={1}
				p={theme.spacing(4)}
			>
				<Typography textTransform={"uppercase"}>{label}</Typography>
				<Stack
					direction="row"
					justifyContent={"space-between"}
				>
					<Typography>{`${value}%`}</Typography>
					<Typography>{`${t("pages.pageSpeed.charts.legend.weight")}: ${weight}%`}</Typography>
				</Stack>
			</Stack>
			<Box
				width={4}
				bgcolor={theme.palette[palette].light}
				sx={{
					borderTopRightRadius: theme.shape.borderRadius,
					borderBottomRightRadius: theme.shape.borderRadius,
				}}
			/>
		</Stack>
	);
};

export const PiePageSpeedLegend = ({ latestCheck }: { latestCheck?: CheckSnapshot }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	if (!latestCheck) {
		return null;
	}
	return (
		<BaseChart
			icon={
				<BarChart3
					size={20}
					strokeWidth={1.5}
				/>
			}
			title={t("pages.pageSpeed.charts.legend.title")}
		>
			<Stack gap={theme.spacing(4)}>
				<MetricBox
					label={t("pages.pageSpeed.charts.common.si")}
					value={Math.floor((latestCheck.audits?.si?.score || 0) * 100)}
					weight={10}
				/>
				<MetricBox
					label={t("pages.pageSpeed.charts.common.fcp")}
					value={Math.floor((latestCheck.audits?.fcp?.score || 0) * 100)}
					weight={10}
				/>
				<MetricBox
					label={t("pages.pageSpeed.charts.common.cls")}
					value={Math.floor((latestCheck.audits?.cls?.score || 0) * 100)}
					weight={25}
				/>
				<MetricBox
					label={t("pages.pageSpeed.charts.common.tbt")}
					value={Math.floor((latestCheck.audits?.tbt?.score || 0) * 100)}
					weight={30}
				/>
				<MetricBox
					label={t("pages.pageSpeed.charts.common.lcp")}
					value={Math.floor((latestCheck.audits?.lcp?.score || 0) * 100)}
					weight={25}
				/>
			</Stack>
		</BaseChart>
	);
};
