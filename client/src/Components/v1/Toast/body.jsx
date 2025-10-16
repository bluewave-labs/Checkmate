import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";

const ToastBody = ({ body }) => {
	const theme = useTheme();

	if (Array.isArray(body)) {
		return (
			<Stack gap={theme.spacing(2)}>
				{body.map((item, idx) => (
					<Typography
						key={`item-${idx}`}
						color={theme.palette.secondary.contrastText}
					>
						{item}
					</Typography>
				))}
			</Stack>
		);
	} else if (typeof body === "string") {
		return <Typography color={theme.palette.secondary.contrastText}>{body}</Typography>;
	}

	return null;
};

ToastBody.propTypes = {
	body: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
};

export default ToastBody;
