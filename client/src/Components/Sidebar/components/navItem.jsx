import Tooltip from "@mui/material/Tooltip";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";

const NavItem = ({ item, collapsed, selected, onClick }) => {
	const theme = useTheme();
	const iconStroke = selected
		? theme.palette.primary.contrastText
		: theme.palette.primary.contrastTextTertiary;

	const buttonBgColor = selected ? theme.palette.secondary.main : "transparent";
	const buttonBgHoverColor = selected
		? theme.palette.secondary.main
		: theme.palette.tertiary.main;
	const fontWeight = selected ? 600 : 400;
	return (
		<Tooltip
			placement="right"
			title={collapsed ? item.name : ""}
			slotProps={{
				popper: {
					modifiers: [
						{
							name: "offset",
							options: {
								offset: [0, -16],
							},
						},
					],
				},
			}}
			disableInteractive
		>
			<ListItemButton
				sx={{
					backgroundColor: buttonBgColor,
					"&:hover": {
						backgroundColor: buttonBgHoverColor,
					},
					height: 37,
					gap: theme.spacing(4),
					borderRadius: theme.shape.borderRadius,
					px: theme.spacing(4),
					pl: theme.spacing(5),
				}}
				onClick={onClick}
			>
				<ListItemIcon
					sx={{
						minWidth: 0,
						"& svg": {
							height: 20,
							width: 20,
							opacity: 0.81,
						},
						"& svg path": {
							stroke: iconStroke,
						},
					}}
				>
					{item.icon}
				</ListItemIcon>
				<Box
					sx={{
						overflow: "hidden",
						transition: "opacity 900ms ease",
						opacity: collapsed ? 0 : 1,
						whiteSpace: "nowrap",
					}}
				>
					<Typography
						variant="body1"
						color={theme.palette.primary.contrastText}
						sx={{
							fontWeight: fontWeight,
							opacity: 0.9,
						}}
					>
						{item.name}
					</Typography>
				</Box>
			</ListItemButton>
		</Tooltip>
	);
};

NavItem.propTypes = {
	item: PropTypes.object,
	collapsed: PropTypes.bool,
	selected: PropTypes.bool,
	onClick: PropTypes.func,
};
export default NavItem;
