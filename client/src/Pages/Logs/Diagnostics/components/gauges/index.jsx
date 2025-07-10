import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Gauge from "../../../../../Components/Charts/CustomGauge";
import Typography from "@mui/material/Typography";

// Utils
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";
import { getPercentage } from "./utils";

const GaugeBox = ({ title, subtitle, children }) => {
	const theme = useTheme();
	return (
		<Stack
			alignItems="center"
			p={theme.spacing(2)}
		>
			{children}

			<Typography variant="h2">{title}</Typography>
			<Typography variant="body2">{subtitle}</Typography>
		</Stack>
	);
};

const Gauges = ({ diagnostics }) => {
	const heapTotalSize = getPercentage(
		diagnostics?.v8HeapStats?.totalHeapSizeMb,
		diagnostics?.v8HeapStats?.heapSizeLimitMb
	);

	const heapUsedSize = getPercentage(
		diagnostics?.v8HeapStats?.usedHeapSizeMb,
		diagnostics?.v8HeapStats?.heapSizeLimitMb
	);

	const actualHeapUsed = getPercentage(
		diagnostics?.v8HeapStats?.usedHeapSizeMb,
		diagnostics?.v8HeapStats?.totalHeapSizeMb
	);
	const theme = useTheme();

	return (
		<Stack
			direction="row"
			spacing={theme.spacing(4)}
		>
			<GaugeBox
				title="Heap Allocation"
				subtitle="% of available memory"
			>
				<Gauge progress={heapTotalSize} />
			</GaugeBox>
			<GaugeBox
				title="Heap Usage"
				subtitle="% of available memory"
			>
				<Gauge progress={heapUsedSize} />
			</GaugeBox>
			<GaugeBox
				title="Heap Utilization"
				subtitle="% of Allocated"
			>
				<Gauge progress={actualHeapUsed} />
			</GaugeBox>
		</Stack>
	);
};

Gauges.propTypes = {
	diagnostics: PropTypes.object.isRequired,
};

export default Gauges;
