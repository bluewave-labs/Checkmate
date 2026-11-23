import MuiTabs from "@mui/material/Tabs";
import type { TabsProps } from "@mui/material/Tabs";
import MuiTab from "@mui/material/Tab";
import type { TabProps } from "@mui/material/Tab";
import type { LucideIcon } from "lucide-react";
import Icon from "./Icon";
import { useTheme } from "@mui/material/styles";
import { typographyLevels, fontWeights } from "@/Utils/Theme/Palette";
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";

interface CustomTabsProps extends TabsProps {}

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
					gap: theme.spacing(SPACING.MD),
					paddingLeft: theme.spacing(LAYOUT.XS_PLUS),
				},
			}}
			{...props}
		>
			{props.children}
		</MuiTabs>
	);
};

interface CustomTabProps extends TabProps {}

export const TabIcon = ({ icon }: { icon: LucideIcon }) => (
	<Icon
		icon={icon}
		size={15}
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
				fontWeight: fontWeights.regular,
				minHeight: "auto",
				minWidth: "auto",
				pt: LAYOUT.XS,
				px: LAYOUT.SM_PLUS,
				pb: LAYOUT.XS,
				gap: LAYOUT.XS,
				color: theme.palette.neutral.tertiary,
				backgroundColor: theme.palette.neutral.raised,
				border: `1px solid ${theme.palette.neutral.hairline}`,
				borderRadius: theme.spacing(LAYOUT.XS, LAYOUT.XS, 0, 0),
				"&:hover": {
					color: theme.palette.text.primary,
				},
				"&.Mui-selected": {
					color: theme.palette.text.primary,
					fontWeight: fontWeights.medium,
					backgroundColor: theme.palette.background.paper,
					borderBottomColor: theme.palette.background.paper,
				},
				"&.Mui-focusVisible": {
					outline: `2px solid ${theme.palette.primary.main}`,
					outlineOffset: -2,
				},
				"&& > .MuiTab-icon, && > .MuiTab-iconWrapper": {
					margin: 0,
					color: theme.palette.neutral.icon,
				},
			}}
			{...props}
		/>
	);
};
