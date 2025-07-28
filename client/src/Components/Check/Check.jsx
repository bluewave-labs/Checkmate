import "./check.css";
import PropTypes from "prop-types";
import CheckGrey from "../../assets/icons/check.svg?react";
import CheckOutlined from "../../assets/icons/check-outlined.svg?react";
import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";

/**
 * `Check` is a functional React component that displays a check icon and a label.
 *
 * @component
 * @param {Object} props - The properties that define the `Check` component.
 * @param {string} props.text - The text to be displayed as the label next to the check icon.
 * @param {'info' | 'error' | 'success'} [props.variant='info'] - The variant of the check component, affecting its styling.
 * @param {boolean} [props.outlined] - Whether the check icon should be outlined or not.
 *
 * @example
 * // To use this component, import it and use it in your JSX like this:
 * <Check text="Your Text Here" />
 *
 * @returns {React.Element} The `Check` component with a check icon and a label, defined by the `text` prop.
 */
const Check = ({ text, noHighlightText, variant = "info", outlined = false }) => {
	const theme = useTheme();
	const colors = {
		success: theme.palette.success.main,
		error: theme.palette.error.main,
		info: theme.palette.info.border,
	};
	return (
		<Stack
			direction="row"
			className="check"
			gap={outlined ? theme.spacing(6) : theme.spacing(4)}
			alignItems="center"
		>
			{outlined ? (
				<CheckOutlined alt="check" />
			) : (
				<Box
					lineHeight={0}
					sx={{
						"& svg > path": { fill: colors[variant] },
					}}
				>
					<CheckGrey alt="form checks" />
				</Box>
			)}
			<Typography
				component="span"
				sx={{
					color:
						variant === "info"
							? theme.palette.primary.contrastTextSecondary
							: colors[variant],
					opacity: 0.9,
					fontWeight: 450,
				}}
			>
				{noHighlightText && <Typography component="span">{noHighlightText}</Typography>}{" "}
				{text}
			</Typography>
		</Stack>
	);
};

Check.propTypes = {
	text: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
	noHighlightText: PropTypes.string,
	variant: PropTypes.oneOf(["info", "error", "success"]),
	outlined: PropTypes.bool,
};

export default Check;
