import MuiTabs from "@mui/material/Tabs";
import type { TabsProps } from "@mui/material/Tabs";
import { useTheme } from "@mui/material/styles";
import { typographyLevels } from "@/Utils/Theme/Palette";
import {
	FOCUS_RING,
	FONT_WEIGHT,
	GAP,
	ICON_SIZE,
	ICON_STROKE,
	PADDING,
	RADIUS,
} from "@/Utils/Theme/constants";
interface CustomTabsProps extends TabsProps {}

// Folder tabs: the selected tab joins the panel below, no indicator bar
export const Tabs = (props: CustomTabsProps) => {
	const theme = useTheme();
	return (
		<MuiTabs
			sx={{
				minHeight: "auto",
				boxShadow: `inset 0 -1px 0 ${theme.palette.neutral.hairline}`,
				"& .MuiTabs-indicator": {
					display: "none",
				},
				"& .MuiTabs-flexContainer": {
					gap: GAP.TAB,
					paddingLeft: PADDING.TAB_ROW_INSET,
				},
			}}
			{...props}
		>
			{props.children}
		</MuiTabs>
	);
};

import MuiTab from "@mui/material/Tab";
import type { TabProps } from "@mui/material/Tab";
import type { LucideIcon } from "lucide-react";
interface CustomTabProps extends TabProps {}

export const TabIcon = ({ icon: IconComponent }: { icon: LucideIcon }) => (
	<IconComponent
		size={ICON_SIZE.TAB}
		strokeWidth={ICON_STROKE}
	/>
);

export const Tab = (props: CustomTabProps) => {
	const theme = useTheme();
	return (
		<MuiTab
			disableRipple
			iconPosition="start"
			sx={{
				textTransform: "none",
				fontSize: typographyLevels.m,
				fontWeight: FONT_WEIGHT.REGULAR,
				minHeight: "auto",
				minWidth: "auto",
				padding: PADDING.TAB,
				color: theme.palette.neutral.tertiary,
				backgroundColor: theme.palette.neutral.raised,
				border: `1px solid ${theme.palette.neutral.hairline}`,
				borderRadius: RADIUS.TAB,
				"&:hover": {
					color: theme.palette.text.primary,
				},
				"&.Mui-selected": {
					color: theme.palette.text.primary,
					fontWeight: FONT_WEIGHT.MEDIUM,
					backgroundColor: theme.palette.background.paper,
					borderBottomColor: theme.palette.background.paper,
				},
				"&.Mui-focusVisible": {
					outline: `${FOCUS_RING.WIDTH}px solid ${theme.palette.primary.main}`,
					outlineOffset: FOCUS_RING.INSET_OFFSET,
				},
				// Doubled selector beats MUI's icon margin so GAP.ICON is the only spacing
				gap: GAP.ICON,
				"&& > .MuiTab-icon, && > .MuiTab-iconWrapper": {
					margin: 0,
					color: theme.palette.neutral.icon,
				},
			}}
			{...props}
		/>
	);
};
