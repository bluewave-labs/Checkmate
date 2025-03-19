import React from "react";
import PropTypes from "prop-types";
import NotFoundSvg from "../../../src/assets/Images/sushi_404.svg";
import { Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";

/**
 * Support for defaultProps will be removed from function components in a future major release
 * So That why we're using JavaScript default parameters instead.
 */
const DefaultValue = {
	title: "Oh no! You dropped your sushi!",
	desc: "Either the URL doesn’t exist, or you don’t have access to it.",
};

/**
 * Renders an error page component with a customizable title and description.
 *
 * @component
 * @example
 * // Usage:
 * <ErrorPage
 *   title="Page Not Found"
 *   desc="The requested page could not be found."
 * />
 *
 * @param {Object} props - The component props.
 * @param {string} [props.title="Oh no! You dropped your sushi!"] - The title of the error page.
 * @param {string} [props.desc="Either the URL doesn’t exist, or you don’t have access to it."] - The description of the error page.
 * @returns {JSX.Element} The rendered error page component.
 */
const NotFound = ({ title = DefaultValue.title, desc = DefaultValue.desc }) => {
	const navigate = useNavigate();
	const theme = useTheme();
	const { t } = useTranslation();

	return (
		<Stack
			height="100vh"
			justifyContent="center"
		>
			<Stack
				gap={theme.spacing(2)}
				alignItems="center"
			>
				<img
					src={NotFoundSvg}
					alt="404"
					style={{ maxHeight: "25rem" }}
				/>
				<Typography
					component="h1"
					variant="h1"
					fontSize={16}
				>
					{title}
				</Typography>
				<Typography variant="body1">{desc}</Typography>
				<Button
					variant="contained"
					color="accent"
					sx={{ mt: theme.spacing(10) }}
					onClick={() => navigate("/")}
				>
					{t("notFoundButton")}
				</Button>
			</Stack>
		</Stack>
	);
};

NotFound.propTypes = {
	title: PropTypes.string,
	desc: PropTypes.string,
};

export default NotFound;
