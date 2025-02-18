import PropTypes from "prop-types";

const Dot = ({ color = "gray", size = "4px" }) => {
	return (
		<span
			style={{
				content: '""',
				width: size,
				height: size,
				borderRadius: "50%",
				backgroundColor: color,
				opacity: 0.8,
			}}
		/>
	);
};

Dot.propTypes = {
	color: PropTypes.string,
	size: PropTypes.string,
};

export default Dot;
