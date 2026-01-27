import ChartBox from "@/Components/v1/Charts/ChartBox/index.jsx";
import Icon from "@/Components/v1/Icon";
import PieChart from "../Charts/PieChart.jsx";
import { Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import PieChartLegend from "../Charts/PieChartLegend.jsx";
import SkeletonLayout from "./skeleton.jsx";
import { useTranslation } from "react-i18next";

const PerformanceReport = ({ shouldRender, audits }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	if (!shouldRender) {
		return <SkeletonLayout />;
	}

	return (
		<ChartBox
			icon={
				<Icon
					name="Layers"
					size={20}
				/>
			}
			header="Performance report"
			Legend={<PieChartLegend audits={audits} />}
			borderRadiusRight={16}
		>
			<PieChart audits={audits} />
			<Typography
				variant="body1"
				mt="auto"
				sx={{
					textAlign: "center",
				}}
			>
				{t("pageSpeedDetailsPerformanceReport")}{" "}
				<Typography
					component="span"
					fontSize="inherit"
					sx={{
						color: theme.palette.primary.contrastTextTertiary,
						fontWeight: 500,
						textDecoration: "underline",
						textUnderlineOffset: 2,
						transition: "all 200ms",
						cursor: "pointer",
						"&:hover": {
							textUnderlineOffset: 4,
						},
					}}
				>
					{t("pageSpeedDetailsPerformanceReportCalculator")}
				</Typography>
			</Typography>
		</ChartBox>
	);
};

export default PerformanceReport;
