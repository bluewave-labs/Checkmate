import ChartBox from "../../../../../Components/Charts/ChartBox";
import PerformanceIcon from "../../../../../assets/icons/performance-report.svg?react";
import PieChart from "../Charts/PieChart";
import { Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import PieChartLegend from "../Charts/PieChartLegend";
import SkeletonLayout from "./skeleton";

const PerformanceReport = ({ shouldRender, audits }) => {
	const theme = useTheme();

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
				Values are estimated and may vary.{" "}
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
					See calculator
				</Typography>
			</Typography>
		</ChartBox>
	);
};

export default PerformanceReport;
