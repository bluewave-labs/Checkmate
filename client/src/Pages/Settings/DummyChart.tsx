import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { HeatmapResponseTime, HistogramResponseTime } from "@/Components/v2/common";
import type { Check } from "@/Types/Check";

interface DummyChartProps {
	chartType: string;
}

const generateDummyChecks = (): Check[] => {
	const checks: Check[] = [];
	for (let i = 0; i < 25; i++) {
		const isUp = Math.random() > 0.1;
		checks.push({
			id: `dummy-${i}`,
			metadata: {
				monitorId: "dummy-monitor",
				teamId: "dummy-team",
				type: "http",
			},
			status: isUp,
			statusCode: isUp ? 200 : 500,
			responseTime: Math.floor(Math.random() * 80) + 20,
			message: "",
			ack: false,
			expiry: new Date(Date.now() + 86400000).toISOString(),
			createdAt: new Date(Date.now() - i * 60000).toISOString(),
			updatedAt: new Date(Date.now() - i * 60000).toISOString(),
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
