import RightArrow from "../../assets/icons/right-arrow.svg?react";
import RightArrowDouble from "../../assets/icons/right-arrow-double.svg?react";
import PropTypes from "prop-types";

const ArrowRight = ({ type, color = "#667085", ...props }) => {
	if (type === "double") {
		return (
			<RightArrowDouble
				style={{ color }}
				{...props}
			/>
		);
	} else {
		return (
			<RightArrow
				style={{ color }}
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
