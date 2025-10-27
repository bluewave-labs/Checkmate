import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import type { Check } from "@/Types/Check";
import { HistogramResponseTimeTooltip } from "@/Components/v2/Monitors/HistogramResponseTimeTooltip";
import { normalizeResponseTimes } from "@/Utils/v2/DataUtils";

export const HistogramResponseTime = ({ checks }: { checks: Check[] }) => {
	const normalChecks = normalizeResponseTimes(checks, "responseTime");
	let data = Array<any>();

	if (!normalChecks || normalChecks.length === 0) {
		return null;
	}
	if (normalChecks.length !== 25) {
		const placeholders = Array(25 - normalChecks.length).fill("placeholder");
		data = [...normalChecks, ...placeholders];
	} else {
		data = normalChecks;
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
									height={`${check.normalResponseTime}%`}
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
