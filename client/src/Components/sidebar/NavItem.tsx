import Tooltip from "@mui/material/Tooltip";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useSidebar from "@/Hooks/useSidebar";

export interface NavData {
	name: string;
	icon: React.ReactElement;
}

export const NavItem = ({
	item,
	selected,
	onClick,
}: {
	item: NavData;
	selected: boolean;
	onClick: (event: React.MouseEvent) => void;
}) => {
	const { collapsed } = useSidebar();
	const theme = useTheme();
	const iconStroke = selected ? theme.palette.primary.main : theme.palette.text.secondary;

	const buttonBgColor = selected ? theme.palette.action.selected : "transparent";
	const buttonBgHoverColor = selected
		? theme.palette.action.selected
		: theme.palette.action.hover;
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
					backgroundImage: "none",
					border: 1,
					borderColor: "transparent",
					"&:hover": {
						backgroundColor: buttonBgHoverColor,
						backgroundImage: "none",
					},
					height: 32,
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
							height: 16,
							width: 16,
							opacity: 0.81,
							transition: "stroke 0.2s ease",
						},
						"& svg path, & svg line, & svg polyline, & svg rect, & svg circle": {
							stroke: iconStroke,
						},
						".MuiListItemButton-root:hover &": {
							"& svg path, & svg line, & svg polyline, & svg rect, & svg circle": {
								stroke: theme.palette.primary.main,
							},
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
