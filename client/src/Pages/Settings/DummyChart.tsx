import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { HeatmapResponseTime, HistogramResponseTime } from "@/Components/common";
import type { CheckSnapshot } from "@/Types/Check";
import { MAX_RECENT_CHECKS } from "@/Types/Monitor";

interface DummyChartProps {
	chartType: string;
}

const generateDummyChecks = (): CheckSnapshot[] => {
	const checks: CheckSnapshot[] = [];
	for (let i = 0; i < MAX_RECENT_CHECKS; i++) {
		const isUp = Math.random() > 0.1;
		const responseTime = Math.floor(Math.random() * 80) + 20;
		checks.push({
			id: `dummy-${i}`,
			status: isUp,
			statusCode: isUp ? 200 : 500,
			responseTime: responseTime,
			originalResponseTime: responseTime,
			message: "",
			createdAt: new Date(Date.now() - i * 60000).toISOString(),
		});
	}
	return checks;
};

const dummyChecks = generateDummyChecks();

const DummyChart = ({ chartType }: DummyChartProps) => {
	const theme = useTheme();

	return (
		<Box
			sx={{
				mt: theme.spacing(4),
				p: theme.spacing(4),
				border: 1,
				borderColor: theme.palette.divider,
				borderRadius: theme.shape.borderRadius,
				backgroundColor: theme.palette.background.paper,
			}}
		>
			<Typography
				variant="body2"
				color="text.secondary"
				sx={{ mb: theme.spacing(2) }}
			>
				Preview
			</Typography>
			{chartType === "histogram" ? (
				<HistogramResponseTime checks={dummyChecks} />
			) : (
				<HeatmapResponseTime checks={dummyChecks} />
			)}
		</Box>
	);
};

export default DummyChart;
