import { Box } from "@mui/material";
import PropTypes from "prop-types";

const isValidBase64Image = (data) => {
	return /^[A-Za-z0-9+/=]+$/.test(data);
};

const Image = ({
	shouldRender = true,
	src,
	alt,
	width = "auto",
	height = "auto",
	minWidth = "auto",
	minHeight = "auto",
	maxWidth = "auto",
	maxHeight = "auto",
	base64,
	placeholder,
	sx,
}) => {
	if (shouldRender === false) {
		return null;
	}

	if (typeof src !== "undefined" && typeof base64 !== "undefined") {
		console.warn("base64 takes precedence over src and overwrites it");
	}

	if (typeof base64 !== "undefined" && isValidBase64Image(base64)) {
		src = `data:image/png;base64,${base64}`;
	}

	if (
		typeof src === "undefined" &&
		typeof base64 === "undefined" &&
		typeof placeholder !== "undefined"
	) {
		src = placeholder;
	}

	return (
		<Box
			component="img"
			src={src}
			alt={alt}
			minWidth={minWidth}
			minHeight={minHeight}
			maxWidth={maxWidth}
			maxHeight={maxHeight}
			width={width}
			height={height}
			sx={{ ...sx }}
		/>
	);
};

Image.propTypes = {
	shouldRender: PropTypes.bool,
	src: PropTypes.string,
	alt: PropTypes.string.isRequired,
	width: PropTypes.string,
	height: PropTypes.string,
	minWidth: PropTypes.string,
	minHeight: PropTypes.string,
	maxWidth: PropTypes.string,
	maxHeight: PropTypes.string,
	base64: PropTypes.string,
	sx: PropTypes.object,
};

export default Image;
