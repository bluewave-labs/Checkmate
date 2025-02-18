import { Box, Typography, Divider } from "@mui/material";
import Checkbox from "../../../../../Components/Inputs/Checkbox";
import MetricsIcon from "../../../../../assets/icons/ruler-icon.svg?react";
import LegendBox from "../../../../../Components/Charts/LegendBox";

import { useTheme } from "@emotion/react";

const AreaChartLegend = ({ metrics, handleMetrics }) => {
	const theme = useTheme();
	return (
		<LegendBox
			icon={<MetricsIcon />}
			header="Metrics"
		>
			<Box>
				<Typography
					fontSize={11}
					fontWeight={500}
				>
					Shown
				</Typography>
				<Divider sx={{ mt: theme.spacing(2) }} />
			</Box>
			<Checkbox
				id="accessibility-toggle"
				label="Accessibility"
				isChecked={metrics.accessibility}
				onChange={() => handleMetrics("accessibility")}
			/>
			<Divider />
			<Checkbox
				id="best-practices-toggle"
				label="Best Practices"
				isChecked={metrics.bestPractices}
				onChange={() => handleMetrics("bestPractices")}
			/>
			<Divider />
			<Checkbox
				id="performance-toggle"
				label="Performance"
				isChecked={metrics.performance}
				onChange={() => handleMetrics("performance")}
			/>
			<Divider />
			<Checkbox
				id="seo-toggle"
				label="Search Engine Optimization"
				isChecked={metrics.seo}
				onChange={() => handleMetrics("seo")}
			/>
			<Divider />
		</LegendBox>
	);
};

export default AreaChartLegend;
