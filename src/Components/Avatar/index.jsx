import { Avatar as MuiAvatar } from "@mui/material";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useTheme } from "@emotion/react";
/**
 * @component
 * @param {Object} props
 * @param {string} props.src - Path to image for avatar
 * @param {boolean} props.small - Specifies if avatar should be large
 * @param {Object} [props.sx] - Additional styles to apply to the button.
 * @returns {JSX.Element}
 * @example
 * // Render a red label
 * <Avatar src="assets/img" first="Alex" last="Holliday" small />
 */

const Avatar = ({ src, small, sx }) => {
	const { user } = useSelector((state) => state.auth);
	const theme = useTheme();

	const style = small ? { width: 32, height: 32 } : { width: 64, height: 64 };
	const border = small ? 1 : 3;

	const [image, setImage] = useState();
	useEffect(() => {
		if (user.avatarImage) {
			setImage(`data:image/png;base64,${user.avatarImage}`);
		}
	}, [user?.avatarImage]);

	return (
		<MuiAvatar
			alt={`${user?.firstName} ${user?.lastName}`}
			/* TODO What is the  /static/images/avatar/2.jpg ?*/
			src={src ? src : user?.avatarImage ? image : "/static/images/avatar/2.jpg"}
			sx={{
				fontSize: small ? "16px" : "22px",
				fontWeight: 400,
				color: theme.palette.accent.contrastText,
				backgroundColor: theme.palette.accent.main, // Same BG color as checkmate BG in sidebar
				display: "inline-flex",
				/* 
				TODO not sure what this is for*/
				"&::before": {
					content: `""`,
					position: "absolute",
					top: 0,
					left: 0,
					width: `100%`,
					height: `100%`,
					border: `${border}px solid rgba(255,255,255,0.2)`,
					borderRadius: "50%",
				},
				...style,
				...sx,
			}}
		>
			{user.firstName?.charAt(0)}
			{user.lastName?.charAt(0) || ""}
		</MuiAvatar>
	);
};

Avatar.propTypes = {
	src: PropTypes.string,
	small: PropTypes.bool,
	sx: PropTypes.object,
};

export default Avatar;
