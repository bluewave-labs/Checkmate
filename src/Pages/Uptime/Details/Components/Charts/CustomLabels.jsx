import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { formatDateWithTz } from "../../../../../Utils/timeUtils";

const CustomLabels = ({ x, width, height, firstDataPoint, lastDataPoint, type }) => {
	const uiTimezone = useSelector((state) => state.ui.timezone);
	const dateFormat = type === "day" ? "MMM D, h:mm A" : "MMM D";

	return (
		<>
			<text
				x={x}
				y={height}
				dy={-3}
				textAnchor="start"
				fontSize={11}
			>
				{formatDateWithTz(firstDataPoint._id, dateFormat, uiTimezone)}
			</text>
			<text
				x={width}
				y={height}
				dy={-3}
				textAnchor="end"
				fontSize={11}
			>
				{formatDateWithTz(lastDataPoint._id, dateFormat, uiTimezone)}
			</text>
		</>
	);
};

CustomLabels.propTypes = {
	x: PropTypes.number.isRequired,
	width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	firstDataPoint: PropTypes.object,
	lastDataPoint: PropTypes.object,
	type: PropTypes.string.isRequired,
};

export default CustomLabels;
