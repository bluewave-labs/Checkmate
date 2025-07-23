import { useTheme } from "@mui/material/styles";
import { Typography } from "@mui/material";
import PropTypes from "prop-types";

const FallbackTitle = ({ title }) => {
	const theme = useTheme();
	return (
		<Typography
			alignSelf="center"
			component="h1"
			marginY={theme.spacing(4)}
			color={theme.palette.primary.contrastTextTertiary}
		>
			{title}
		</Typography>
	);
};
FallbackTitle.propTypes = {
	title: PropTypes.string.isRequired,
};
export default FallbackTitle;
