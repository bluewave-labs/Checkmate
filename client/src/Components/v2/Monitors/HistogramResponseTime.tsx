import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import type { Check } from "@/Types/Check";
import { HistogramResponseTimeTooltip } from "@/Components/v2/Monitors/HistogramResponseTimeTooltip";

export const HistogramResponseTime = ({ checks }: { checks: Check[] }) => {
	let data = Array<any>();

	data = checks.map((c) => Math.max(c.responseTime, 1));

	const logResponses = data.map((r) => Math.log10(r));
	const logMin = Math.min(...logResponses);
	const logMax = Math.max(...logResponses);

	if (!checks) {
		return null;
	}
	if (checks.length !== 25) {
		const placeholders = Array(25 - checks.length).fill("placeholder");
		data = [...checks, ...placeholders];
	} else {
		data = checks;
	}

	const theme = useTheme();

	return (
		<Stack
			direction="row"
			flexWrap="nowrap"
			gap={theme.spacing(1.5)}
			height="50px"
			width="fit-content"
			onClick={(event) => event.stopPropagation()}
			sx={{
				cursor: "default",
			}}
		>
			{data.map((check, index) => {
				const safeResponse = Math.max(check.responseTime, 1);
				const logValue = Math.log10(safeResponse);
				const minHeight = 10;
				const barHeight =
					logMax === logMin
						? 100
						: Math.max(minHeight, ((logValue - logMin) / (logMax - logMin)) * 100);

				if (check === "placeholder") {
					return (
						<Box
							key={`${check}-${index}`}
							position="relative"
							width={theme.spacing(4.5)}
							height="100%"
							bgcolor={theme.palette.primary.lowContrast}
							sx={{
								borderRadius: theme.spacing(1.5),
							}}
						/>
					);
				} else {
					return (
						<HistogramResponseTimeTooltip
							key={`${check}-${index}`}
							check={check}
						>
							<Box
								position="relative"
								width="9px"
								height="100%"
								bgcolor={theme.palette.primary.lowContrast}
								sx={{
									borderRadius: theme.spacing(1.5),
								}}
							>
								<Box
									position="absolute"
									bottom={0}
									width="100%"
									height={`${barHeight}%`}
									bgcolor={
										check.status
											? theme.palette.success.lowContrast
											: theme.palette.error.lowContrast
									}
									sx={{
										borderRadius: theme.spacing(1.5),
										transition: "height 600ms cubic-bezier(0.4, 0, 0.2, 1)",
									}}
								/>
							</Box>
						</HistogramResponseTimeTooltip>
					);
				}
			})}
		</Stack>
	);
};
