import { Link as MuiLink, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import PropTypes from "prop-types";

/**
 * @component
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'tertiary' | 'error'} props.level - The level of the link
 * @param {string} props.label - The label of the link
 * @param {string} props.url - The URL of the link
 * @returns {JSX.Element}
 */

const Link = ({ level, label, url, external = true }) => {
	const theme = useTheme();

	const levelConfig = {
		primary: {
			color: theme.palette.primary.contrastTextTertiary,
			sx: {
				":hover": {
					color: theme.palette.primary.contrastTextSecondary,
				},
			},
		},
		secondary: {
			color: theme.palette.primary.contrastTextSecondary,
			sx: {
				":hover": {
					color: theme.palette.primary.contrastTextSecondary,
				},
			},
		},
		tertiary: {
			color: theme.palette.primary.contrastTextTertiary,
			sx: {
				textDecoration: "underline",
				textDecorationStyle: "dashed",
				textDecorationColor: theme.palette.primary.main,
				textUnderlineOffset: "1px",
				":hover": {
					color: theme.palette.primary.contrastTextTertiary,
					textDecorationColor: theme.palette.primary.main,
					backgroundColor: theme.palette.primary.lowContrast,
				},
			},
		},
		error: {},
	};
	const { sx, color } = levelConfig[level];
	return (
		<MuiLink
			component={external ? "a" : RouterLink}
			to={external ? undefined : url}
			href={external ? url : undefined}
			sx={{ width: "fit-content", ...sx }}
			color={color}
			{...(external && { target: "_blank", rel: "noreferrer" })}
		>
			{label}
		</MuiLink>
	);
};

Link.propTypes = {
	url: PropTypes.string.isRequired,
	level: PropTypes.oneOf(["primary", "secondary", "tertiary", "error"]),
	label: PropTypes.string.isRequired,
	external: PropTypes.bool,
};

export default Link;
