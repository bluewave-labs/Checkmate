import PropTypes from "prop-types";
import { Box, Breadcrumbs as MUIBreadcrumbs } from "@mui/material";
import { useTheme } from "@emotion/react";
import { useNavigate } from "react-router";
import ArrowRight from "../../assets/icons/right-arrow.svg?react";

import "./index.css";

/**
 * Breadcrumbs component that displays a list of breadcrumb items.
 *
 * @param {Object} props
 * @param {Array} props.list - Array of breadcrumb items. Each item should have `name` and `path` properties.
 * @param {string} props.list.name - The name to display for the breadcrumb.
 * @param {string} props.list.path - The path to navigate to when the breadcrumb is clicked.
 *
 * @returns {JSX.Element} The rendered Breadcrumbs component.
 */

const Breadcrumbs = ({ list }) => {
	const theme = useTheme();
	const navigate = useNavigate();

	return (
		<MUIBreadcrumbs
			separator={<ArrowRight />}
			aria-label="breadcrumb"
			px={theme.spacing(2)}
			py={theme.spacing(3.5)}
			width="fit-content"
			backgroundColor={theme.palette.secondary.main}
			borderRadius={theme.shape.borderRadius}
			lineHeight="18px"
			sx={{
				"& .MuiBreadcrumbs-li a": {
					transition: "background-color 0.2s ease-in-out, color 0.2s ease-in-out",
				},
				"& .MuiBreadcrumbs-li:not(:last-of-type):hover a": {
					backgroundColor: theme.palette.secondary.contrastText,
					color: theme.palette.secondary.main,
				},
			}}
		>
			{list.map((item, index) => {
				return (
					<Box
						component="a"
						key={`${item.name}-${index}`}
						px={theme.spacing(4)}
						pt={theme.spacing(2)}
						pb={theme.spacing(3)}
						borderRadius={theme.shape.borderRadius}
						onClick={() => navigate(item.path)}
						sx={{
							opacity: 0.8,
							textTransform: "capitalize",
							"&, &:hover": {
								color: theme.palette.secondary.contrastText,
							},
						}}
					>
						{item.name}
					</Box>
				);
			})}
		</MUIBreadcrumbs>
	);
};

Breadcrumbs.propTypes = {
	list: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string.isRequired,
			path: PropTypes.string.isRequired,
		}).isRequired
	).isRequired,
};

export default Breadcrumbs;
