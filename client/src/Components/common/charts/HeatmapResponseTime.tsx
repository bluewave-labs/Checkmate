import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import type { CheckSnapshot } from "@/Types/Check";
import { getResponseColor } from "@/Utils/DataUtils";
import { HeatmapResponseTimeTooltip } from "@/Components/common/charts/HeatmapResponseTimeTooltip";
import type { SxProps } from "@mui/material/styles";
import type { ResponsiveStyleValue } from "@mui/system";
import { MAX_RECENT_CHECKS } from "@/Types/Monitor";
interface PlaceholderCheck {
	status: "placeholder";
	responseTime: 0;
	createdAt: "";
}

interface HeatmapResponseTimeProps {
	checks: CheckSnapshot[];
	gap?: ResponsiveStyleValue<number | string>;
	availabilityCellSx?: SxProps;
	responseCellSx?: SxProps;
}

export const HeatmapResponseTime = ({
	checks,
	gap,
	availabilityCellSx,
	responseCellSx,
}: HeatmapResponseTimeProps) => {
	const theme = useTheme();
	if (!gap) {
		gap = theme.spacing(0.5);
	}

	if (!checks || checks.length === 0) return null;

	const latestChecks = checks.slice(-MAX_RECENT_CHECKS);

	let data: Array<CheckSnapshot | PlaceholderCheck>;
	if (latestChecks.length !== MAX_RECENT_CHECKS) {
		const placeholders = Array(MAX_RECENT_CHECKS - latestChecks.length).fill({
			status: "placeholder" as const,
		});
		data = [...latestChecks, ...placeholders];
	} else {
		data = latestChecks;
	}
	return (
		<Box width={"100%"}>
			<Box
				width={"100%"}
				display={"grid"}
				gap={gap}
				sx={{
					gridTemplateColumns: `repeat(${MAX_RECENT_CHECKS}, 1fr)`,
					alignItems: "stretch",
				}}
			>
				{data.map((check, index) => {
					const statusBg =
						check.status === "placeholder"
							? theme.palette.action.hover
							: check.status === true
								? theme.palette.success.light
								: theme.palette.error.light;
					const respBg =
						check.status === "placeholder"
							? theme.palette.action.hover
							: getResponseColor(check.responseTime || 0, {
									start: theme.palette.success.main,
									mid: theme.palette.warning.main,
									end: theme.palette.error.main,
								});
					const statusBorder =
						check.status === "placeholder"
							? theme.palette.divider
							: check.status === true
								? theme.palette.success.main
								: theme.palette.error.main;

					return (
						<HeatmapResponseTimeTooltip
							key={`${check}-${index}`}
							check={check}
						>
							<Box
								display={"grid"}
								sx={{
									gridTemplateRows: "auto auto",
								}}
							>
								<Box
									display={"flex"}
									gap={theme.spacing(2)}
									sx={{
										flexDirection: "column",
									}}
								>
									<Box
										width={"100%"}
										sx={{
											position: "relative",
											aspectRatio: "10",
										}}
									>
										<Box
											bgcolor={statusBg}
											borderRadius={theme.shape.borderRadius}
											sx={{
												position: "absolute",
												inset: 0,
												...availabilityCellSx,
											}}
										/>
										<Box
											borderRadius={theme.shape.borderRadius}
											sx={{
												position: "absolute",
												inset: 0,
												pointerEvents: "none",
												boxShadow: `inset 0 0 0 2px ${statusBorder}`,
											}}
										/>
									</Box>
									<Box
										width={"100%"}
										bgcolor={respBg}
										borderRadius={theme.shape.borderRadius}
										sx={{
											aspectRatio: "1 / 1",
											...responseCellSx,
										}}
									/>
								</Box>
							</Box>
						</HeatmapResponseTimeTooltip>
					);
				})}
			</Box>
		</Box>
	);
};
