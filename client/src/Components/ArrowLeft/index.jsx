import LeftArrow from "../../assets/icons/left-arrow.svg?react";
import LeftArrowDouble from "../../assets/icons/left-arrow-double.svg?react";
import LeftArrowLong from "../../assets/icons/left-arrow-long.svg?react";
import PropTypes from "prop-types";

const ArrowLeft = ({ type, color = "#667085", ...props }) => {
	if (type === "double") {
		return (
			<LeftArrowDouble
				style={{ color }}
				{...props}
			/>
		);
	} else if (type === "long") {
		return (
			<LeftArrowLong
				style={{ color }}
				{...props}
			/>
		);
	} else {
		return (
			<LeftArrow
				style={{ color }}
				{...props}
			/>
		);
	}
};

ArrowLeft.propTypes = {
	color: PropTypes.string,
	type: PropTypes.oneOf(["double", "long", "default"]),
};
export default ArrowLeft;
