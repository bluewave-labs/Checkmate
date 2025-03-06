import { Box, Stack, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { formatDateWithTz } from "../../../../../../Utils/timeUtils";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
const CustomToolTip = ({ active, payload, label }) => {
	const uiTimezone = useSelector((state) => state.ui.timezone);
	const theme = useTheme();
	if (active && payload && payload.length) {
		const responseTime = payload[0]?.payload?.originalAvgResponseTime
			? payload[0]?.payload?.originalAvgResponseTime
			: (payload[0]?.payload?.avgResponseTime ?? 0);
		return (
			<Stack
				className="area-tooltip"
				sx={{
					backgroundColor: theme.palette.primary.main,
					border: 1,
					borderColor: theme.palette.primary.lowContrast,
					borderRadius: theme.shape.borderRadius,
					py: theme.spacing(2),
					px: theme.spacing(4),
				}}
			>
				<Typography
					sx={{
						color: theme.palette.text.tertiary,
						fontSize: 12,
						fontWeight: 500,
					}}
				>
					{formatDateWithTz(label, "ddd, MMMM D, YYYY, h:mm A", uiTimezone)}
				</Typography>

				<Stack
					direction="row"
					alignItems="end"
					gap={theme.spacing(2)}
					sx={{
						"& span": {
							color: theme.palette.text.tertiary,
							fontSize: 11,
							fontWeight: 500,
						},
					}}
				>
					<AccessTimeIcon fontSize="small" />

					<Typography
						component="span"
						sx={{ opacity: 0.8 }}
					>
						Response time:
					</Typography>
					<Typography component="span">
						{Math.floor(responseTime)}
						<Typography
							component="span"
							sx={{ opacity: 0.8 }}
						>
							ms
						</Typography>
					</Typography>
				</Stack>
			</Stack>
		);
	}
	return null;
};

CustomToolTip.propTypes = {
	active: PropTypes.bool,
	payload: PropTypes.arrayOf(
		PropTypes.shape({
			value: PropTypes.number,
			payload: PropTypes.shape({
				_id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
				avgResponseTime: PropTypes.number,
				originalAvgResponseTime: PropTypes.number,
			}),
		})
	),
	label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
export default CustomToolTip;
