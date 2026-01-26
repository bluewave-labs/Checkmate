import Icon from "../Icon";
import PropTypes from "prop-types";

const ArrowLeft = ({ type, color = "#667085", ...props }) => {
	if (type === "double") {
		return (
			<Icon
				name="ChevronsLeft"
				color={color}
				{...props}
			/>
		);
	} else if (type === "long") {
		return (
			<Icon
				name="ArrowLeft"
				color={color}
				{...props}
			/>
		);
	} else {
		return (
			<Icon
				name="ChevronLeft"
				color={color}
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
