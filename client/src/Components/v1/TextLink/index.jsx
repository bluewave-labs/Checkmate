import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import { Link as RouterLink } from "react-router-dom";

const TextLink = ({ text, linkText, href, state, target = "_self" }) => {
	const theme = useTheme();

	return (
		<Stack
			direction="row"
			gap={theme.spacing(4)}
		>
			<Typography>{text}</Typography>
			<Link
				color="accent"
				to={href}
				component={RouterLink}
				target={target}
				state={state}
			>
				{linkText}
			</Link>
		</Stack>
	);
};

TextLink.propTypes = {
	text: PropTypes.string,
	linkText: PropTypes.string,
	href: PropTypes.string,
	state: PropTypes.object,
	target: PropTypes.string,
};

export default TextLink;
