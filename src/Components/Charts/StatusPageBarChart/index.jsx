import { useTheme } from "@emotion/react";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { formatDateWithTz } from "../../../Utils/timeUtils";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";

/**
 * A customizable Bar component that renders a colored bar with optional children.
 * @component
 *
 * @param {string} width The width of the bar (e.g., "100px").
 * @param {string} height The height of the bar (e.g., "50px").
 * @param {string} backgroundColor The background color of the bar (e.g., "#FF5733").
 * @param {string} [borderRadius] Optional border radius for the bar (e.g., "8px").
 * @param {node} children The content to be rendered inside the bar.
 * @returns {JSX.Element} The Bar component.
 */

const Bar = ({ width, height, backgroundColor, borderRadius, children }) => {
	const theme = useTheme();

	return (
		<Box
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
};

Bar.propTypes = {
	width: PropTypes.string.isRequired,
	height: PropTypes.string.isRequired,
	backgroundColor: PropTypes.string.isRequired,
	borderRadius: PropTypes.string,
	children: PropTypes.node,
};

/* TODO add prop validation and jsdocs */
const StatusPageBarChart = ({ checks = [] }) => {
	const theme = useTheme();
	const [animate, setAnimate] = useState(false);
	const uiTimezone = useSelector((state) => state.ui.timezone);

	const barWidth = {
		xs: "calc(60% / 25)",
		xl: "calc(40% / 25)",
	};

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
					<Bar
						key={`${check}-${index}`}
						width={barWidth}
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
						<Bar
							width={barWidth}
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
						</Bar>
					</Tooltip>
				)
			)}
		</Stack>
	);
};

export default StatusPageBarChart;
