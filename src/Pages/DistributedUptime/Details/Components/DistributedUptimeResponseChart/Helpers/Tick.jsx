import { useTheme } from "@emotion/react";
import { useSelector } from "react-redux";
import { formatDateWithTz } from "../../../../../../Utils/timeUtils";
import PropTypes from "prop-types";
import { Text } from "recharts";
const CustomTick = ({ x, y, payload, index }) => {
	const theme = useTheme();

	const uiTimezone = useSelector((state) => state.ui.timezone);
	return (
		<Text
			x={x}
			y={y + 10}
			textAnchor="middle"
			fill={theme.palette.text.tertiary}
			fontSize={11}
			fontWeight={400}
		>
			{formatDateWithTz(payload?.value, "h:mm a", uiTimezone)}
		</Text>
	);
};

CustomTick.propTypes = {
	x: PropTypes.number,
	y: PropTypes.number,
	payload: PropTypes.object,
	index: PropTypes.number,
};

export default CustomTick;
