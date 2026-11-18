import { Tooltip } from "@/Components/design-elements";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";
import useSidebar from "@/Hooks/useSidebar";
import type { SidebarGroupKey } from "@/Utils/Theme/Palette";

const NAV_HOVER_ALPHA = 0.08;
const NAV_SELECTED_ALPHA = 0.16;

export interface NavData {
	name: string;
	icon: React.ReactElement;
}

export const NavItem = ({
	item,
	selected,
	onClick,
	groupKey,
}: {
	item: NavData;
	selected: boolean;
	onClick: (event: React.MouseEvent) => void;
	groupKey?: SidebarGroupKey;
}) => {
	const { collapsed, itemInset } = useSidebar();
	const theme = useTheme();
	const tone = groupKey ? theme.palette.sidebar.groups[groupKey] : null;

	const iconStroke = tone
		? tone.solid
		: selected
			? theme.palette.sidebar.accent
			: theme.palette.neutral.icon;

	const iconHoverStroke = tone ? tone.solid : theme.palette.sidebar.accent;

	const selectedBg = tone
		? alpha(tone.solid, NAV_SELECTED_ALPHA)
		: theme.palette.neutral.selectedGreen;

	const buttonBgColor = selected ? selectedBg : "transparent";
	const buttonBgHoverColor = selected
		? selectedBg
		: tone
			? alpha(tone.solid, NAV_HOVER_ALPHA)
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
					gap: theme.spacing(LAYOUT.XS),
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
