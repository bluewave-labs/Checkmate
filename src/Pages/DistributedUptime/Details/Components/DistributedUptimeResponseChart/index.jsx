//Components
import { Stack, Switch, Typography } from "@mui/material";
import { useState } from "react";
import DistributedUptimeResponseAreaChart from "./Area";
import DistributedUptimeResponseBarChart from "./Bar";
import ChartBox from "../../../../../Components/Charts/ChartBox";
import ResponseTimeIcon from "../../../../../assets/icons/response-time-icon.svg?react";

// Utils
import PropTypes from "prop-types";
const DistributedUptimeResponseChart = ({ checks }) => {
	const [chartType, setChartType] = useState("bar");
	let Chart = null;
	if (chartType === "area") {
		Chart = DistributedUptimeResponseAreaChart;
	}
	if (chartType === "bar") {
		Chart = DistributedUptimeResponseBarChart;
	}
	return (
		<Stack>
			<Stack
				direction="row"
				alignItems="center"
			>
				<Typography>Bar</Typography>
				<Switch
					color="main"
					value={chartType}
					onChange={(e) => setChartType(e.target.checked ? "area" : "bar")}
				/>
				<Typography>Area</Typography>
			</Stack>
			<ChartBox
				icon={<ResponseTimeIcon />}
				header="Response Times"
				sx={{ padding: 0 }}
			>
				<Chart checks={checks} />
			</ChartBox>
		</Stack>
	);
};

DistributedUptimeResponseChart.propTypes = {
	checks: PropTypes.array,
	type: PropTypes.string,
};

export default DistributedUptimeResponseChart;
