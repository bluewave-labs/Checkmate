import ChartBox from "../../../../../Components/Charts/ChartBox";
import PerformanceIcon from "../../../../../assets/icons/performance-report.svg?react";
import PieChart from "../Charts/PieChart";
import { Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import PieChartLegend from "../Charts/PieChartLegend";
import SkeletonLayout from "./skeleton";
import { useTranslation } from "react-i18next";

const PerformanceReport = ({ shouldRender, audits }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	
	if (!shouldRender) {
		return <SkeletonLayout />;
	}

	return (
		<ChartBox
			icon={<PerformanceIcon />}
			header="Performance report"
			Legend={<PieChartLegend audits={audits} />}
			borderRadiusRight={16}
		>
			<PieChart audits={audits} />
			<Typography
				variant="body1"
				mt="auto"
			>
				{t("pageSpeedDetailsPerformanceReport")}{" "}
				<Typography
					component="span"
					fontSize="inherit"
					sx={{
						color: theme.palette.primary.main,
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
