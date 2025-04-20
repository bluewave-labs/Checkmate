// Components
import { Stack, Box, Tooltip, Typography } from "@mui/material";

// Utils
import { useTheme } from "@emotion/react";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { formatDateWithTz } from "../../../Utils/timeUtils";
import { useSelector } from "react-redux";

const PlaceholderCheck = ({ daysToShow }) => {
	const theme = useTheme();

	return (
		<Box
			width={`calc(30vw / ${daysToShow})`}
			height="100%"
			backgroundColor={theme.palette.primary.lowContrast}
			sx={{
				borderRadius: theme.spacing(1.5),
			}}
		/>
	);
};

PlaceholderCheck.propTypes = {
	daysToShow: PropTypes.number,
};

const Check = ({ check, daysToShow }) => {
	const [animate, setAnimate] = useState(false);

	const theme = useTheme();
	useEffect(() => {
		setAnimate(true);
	}, []);
	const uiTimezone = useSelector((state) => state.ui.timezone);

	return (
		<Tooltip
			title={
				<>
					<Typography>
						{formatDateWithTz(check._id, "ddd, MMMM D, YYYY", uiTimezone)}
					</Typography>
					<Box mt={theme.spacing(2)}>
						<Stack
							display="inline-flex"
							direction="row"
							justifyContent="space-between"
							gap={theme.spacing(4)}
						>
							<Typography
								component="span"
								sx={{ opacity: 0.8 }}
							>
								Uptime percentage
							</Typography>
							<Typography component="span">
								{check.upPercentage.toFixed(2)}
								<Typography
									component="span"
									sx={{ opacity: 0.8 }}
								>
									{" "}
									%
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
			<Box
				position="relative"
				width={`calc(30vw / ${daysToShow})`}
				height="100%"
				backgroundColor={theme.palette.error.lowContrast}
				sx={{
					borderRadius: theme.spacing(1.5),
				}}
			>
				<Box
					position="absolute"
					bottom={0}
					width="100%"
					height={`${animate ? check.upPercentage : 0}%`}
					backgroundColor={theme.palette.success.lowContrast}
					sx={{
						borderRadius: theme.spacing(1.5),
						transition: "height 600ms cubic-bezier(0.4, 0, 0.2, 1)",
					}}
				/>
			</Box>
		</Tooltip>
	);
};

Check.propTypes = {
	check: PropTypes.object,
	daysToShow: PropTypes.number,
};

const DePINStatusPageBarChart = ({ checks = [], daysToShow = 30 }) => {
	if (checks.length !== daysToShow) {
		const placeholders = Array(daysToShow - checks.length).fill("placeholder");
		checks = [...checks, ...placeholders];
	}
	return (
		<Stack
			direction="row"
			justifyContent="space-between"
			width="100%"
			flexWrap="nowrap"
			height="50px"
		>
			{checks.map((check) => {
				if (check === "placeholder") {
					return (
						<PlaceholderCheck
							key={Math.random()}
							daysToShow={daysToShow}
						/>
					);
				}
				return (
					<Check
						key={Math.random()}
						check={check}
						daysToShow={daysToShow}
					/>
				);
			})}
		</Stack>
	);
};

DePINStatusPageBarChart.propTypes = {
	checks: PropTypes.array,
	daysToShow: PropTypes.number,
};

export default DePINStatusPageBarChart;
