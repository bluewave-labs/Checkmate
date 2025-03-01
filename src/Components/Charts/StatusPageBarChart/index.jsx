import { useTheme } from "@emotion/react";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { formatDateWithTz } from "../../../Utils/timeUtils";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

/* TODO add prop validation and jsdocs */
const StatusPageBarChart = ({ checks = [] }) => {
	const theme = useTheme();
	const [animate, setAnimate] = useState(false);
	const uiTimezone = useSelector((state) => state.ui.timezone);

	useEffect(() => {
		setAnimate(true);
	}, []);

	// set responseTime to average if there's only one check
	if (checks.length === 1) {
		checks[0] = { ...checks[0], responseTime: 50 };
	}

	if (checks.length !== 25) {
		const placeholders = Array(25 - checks.length).fill("placeholder");
		checks = [...checks, ...placeholders];
	}

	const BarBox = ({ width, height, backgroundColor, borderRadius, children }) => (
		<Box
			marginRight="5px"
			position="relative"
			width={width}
			height={height}
			backgroundColor={backgroundColor}
			sx={{
				borderRadius: borderRadius || theme.spacing(1.5),
			}}
		>
			{children}
		</Box>
	);

	return (
		<Stack
			direction="row"
			justifyContent="space-between"
			width="100%"
			flexWrap="nowrap"
			height="50px"
			onClick={(event) => event.stopPropagation()}
			sx={{
				cursor: "default",
			}}
		>
			{checks.map((check, index) =>
				check === "placeholder" ? (
					/* TODO what is the purpose of this box? 	*/
					// CAIO_REVIEW the purpose of this box is to make sure there are always at least 25 bars
					// even if there are less than 25 checks
					<BarBox
						key={`${check}-${index}`}
						width="calc(30rem / 25)"
						height="100%"
						backgroundColor={theme.palette.primary.lowContrast}
					/>
				) : (
					<Tooltip
						title={
							<>
								<Typography>
									{formatDateWithTz(
										check.createdAt,
										"ddd, MMMM D, YYYY, HH:mm A",
										uiTimezone
									)}
								</Typography>
								<Box mt={theme.spacing(2)}>
									<Box
										display="inline-block"
										width={theme.spacing(4)}
										height={theme.spacing(4)}
										backgroundColor={
											check.status
												? theme.palette.success.lowContrast
												: theme.palette.error.lowContrast
										}
										sx={{ borderRadius: "50%" }}
									/>
									<Stack
										display="inline-flex"
										direction="row"
										justifyContent="space-between"
										ml={theme.spacing(2)}
										gap={theme.spacing(12)}
									>
										<Typography
											component="span"
											sx={{ opacity: 0.8 }}
										>
											Response Time
										</Typography>
										<Typography component="span">
											{check.originalResponseTime}
											<Typography
												component="span"
												sx={{ opacity: 0.8 }}
											>
												{" "}
												ms
											</Typography>
										</Typography>
									</Stack>
								</Box>
							</>
						}
						placement="top"
						key={`check-${check?._id}`}
						slotProps={{
							popper: {
								className: "bar-tooltip",
								modifiers: [
									{
										name: "offset",
										options: {
											offset: [0, -10],
										},
									},
								],
								sx: {
									"& .MuiTooltip-tooltip": {
										backgroundColor: theme.palette.secondary.main,
										border: 1,
										borderColor: theme.palette.primary.lowContrast,
										borderRadius: theme.shape.borderRadius,
										boxShadow: theme.shape.boxShadow,
										px: theme.spacing(4),
										py: theme.spacing(3),
									},
									"& .MuiTooltip-tooltip p": {
										/* TODO Font size should point to theme */
										fontSize: 12,
										color: theme.palette.secondary.contrastText,
										fontWeight: 500,
									},
									"& .MuiTooltip-tooltip span": {
										/* TODO Font size should point to theme */
										fontSize: 11,
										color: theme.palette.secondary.contrastText,
										fontWeight: 600,
									},
								},
							},
						}}
					>
						<BarBox
							width="calc(30rem / 25)"
							height="100%"
							backgroundColor={theme.palette.primary.lowContrast}
						>
							<Box
								position="absolute"
								bottom={0}
								width="100%"
								height={`${animate ? check.responseTime : 0}%`}
								backgroundColor={
									check.status
										? theme.palette.success.lowContrast
										: theme.palette.error.lowContrast
								}
								sx={{
									borderRadius: theme.spacing(1.5),
									transition: "height 600ms cubic-bezier(0.4, 0, 0.2, 1)",
								}}
							/>
						</BarBox>
					</Tooltip>
				)
			)}
		</Stack>
	);
};

export default StatusPageBarChart;
