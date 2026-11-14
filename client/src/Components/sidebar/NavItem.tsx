import Tooltip from "@mui/material/Tooltip";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { SPACING } from "@/Utils/Theme/constants";
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
	const { collapsed, itemInset } = useSidebar();
	const theme = useTheme();
	const iconStroke = selected ? theme.palette.sidebar.accent : theme.palette.neutral.icon;
	const buttonBgColor = selected ? theme.palette.neutral.selectedGreen : "transparent";
	const buttonBgHoverColor = selected
		? theme.palette.neutral.selectedGreen
		: theme.palette.neutral.hoverGreen;
	const fontWeight = selected ? 500 : 400;
	const labelColor = selected ? theme.palette.text.primary : theme.palette.text.secondary;
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
					gap: theme.spacing(SPACING.MD),
					borderRadius: theme.shape.borderRadius,
					px: theme.spacing(SPACING.MD),
					pl: theme.spacing(itemInset),
				}}
				onClick={onClick}
			>
				<ListItemIcon
					sx={{
						minWidth: 0,
						"& svg": {
							height: 16,
							width: 16,
							transition: "stroke 0.2s ease",
						},
						"& svg path, & svg line, & svg polyline, & svg rect, & svg circle": {
							stroke: iconStroke,
						},
						".MuiListItemButton-root:hover &": {
							"& svg path, & svg line, & svg polyline, & svg rect, & svg circle": {
								stroke: theme.palette.sidebar.accent,
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
						fontWeight={fontWeight}
						color={labelColor}
					>
						{item.name}
					</Typography>
				</Box>
			</ListItemButton>
		</Tooltip>
	);
};
