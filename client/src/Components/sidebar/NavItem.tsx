import Tooltip from "@mui/material/Tooltip";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { SPACING, GAP, FONT_WEIGHT } from "@/Utils/Theme/constants";
import useSidebar from "@/Hooks/useSidebar";
import type { SidebarPart } from "@/Utils/Theme/Palette";

export interface NavData {
	name: string;
	icon: React.ReactElement;
}

export const NavItem = ({
	item,
	selected,
	onClick,
	part,
}: {
	item: NavData;
	selected: boolean;
	onClick: (event: React.MouseEvent) => void;
	part?: SidebarPart;
}) => {
	const { collapsed, itemInset } = useSidebar();
	const theme = useTheme();
	// Grouped items take their part's colours; ungrouped items stay grey with a
	// brand-green active state
	const tone = part ? theme.palette.sidebar.parts[part] : null;
	const iconStroke = tone
		? tone.solid
		: selected
			? theme.palette.sidebar.accent
			: theme.palette.neutral.icon;
	const iconHoverStroke = tone ? tone.solid : theme.palette.sidebar.accent;
	const selectedBg = tone ? tone.selected : theme.palette.neutral.selectedGreen;
	const buttonBgColor = selected ? selectedBg : "transparent";
	const buttonBgHoverColor = selected
		? selectedBg
		: tone
			? tone.hover
			: theme.palette.neutral.hoverGreen;
	const fontWeight = selected ? FONT_WEIGHT.MEDIUM : FONT_WEIGHT.REGULAR;
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
					gap: GAP.ICON,
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
								stroke: iconHoverStroke,
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
