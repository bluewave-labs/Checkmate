import Tooltip from "@mui/material/Tooltip";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";

const NavItem = ({ item, collapsed, selected, onClick }) => {
	const theme = useTheme();

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
					backgroundColor: selected ? theme.palette.secondary.main : "transparent",
					"&:hover": {
						backgroundColor: selected
							? theme.palette.secondary.main
							: theme.palette.tertiary.main,
					},
					height: "37px",
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
							height: "20px",
							width: "20px",
							opacity: 0.81,
						},
						"& svg path": {
							stroke: selected
								? theme.palette.primary.contrastText
								: theme.palette.primary.contrastTextTertiary,
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
							fontWeight: selected ? 600 : 400,
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
