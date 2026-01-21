import Icon from "../Icon";
import PropTypes from "prop-types";

const ArrowRight = ({ type, color = "#667085", ...props }) => {
	if (type === "double") {
		return (
			<Icon
				name="ChevronsRight"
				color={color}
				{...props}
			/>
		);
	} else {
		return (
			<Icon
				name="ChevronRight"
				color={color}
				{...props}
			/>
		);
	}
};

ArrowRight.propTypes = {
	type: PropTypes.oneOf(["double", "default"]),
	color: PropTypes.string,
};

export default ArrowRight;
