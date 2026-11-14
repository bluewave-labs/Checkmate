import MuiTabs from "@mui/material/Tabs";
import type { TabsProps } from "@mui/material/Tabs";
import { useTheme } from "@mui/material/styles";
import { typographyLevels } from "@/Utils/Theme/Palette";
interface CustomTabsProps extends TabsProps {}

// Folder tabs: a hairline runs along the bottom of the row and the selected tab
// joins the panel below. No indicator bar.
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
					gap: "3px",
					paddingLeft: "10px",
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
interface CustomTabProps extends TabProps {}

export const Tab = (props: CustomTabProps) => {
	const theme = useTheme();
	return (
		<MuiTab
			disableRipple
			iconPosition="start"
			sx={{
				textTransform: "none",
				fontSize: typographyLevels.m,
				fontWeight: 400,
				minHeight: "auto",
				minWidth: "auto",
				padding: "7px 14px 8px",
				color: theme.palette.neutral.tertiary,
				backgroundColor: theme.palette.neutral.raised,
				border: `1px solid ${theme.palette.neutral.hairline}`,
				borderRadius: "9px 9px 0 0",
				"&:hover": {
					color: theme.palette.text.primary,
				},
				"&.Mui-selected": {
					color: theme.palette.text.primary,
					fontWeight: 500,
					backgroundColor: theme.palette.background.paper,
					borderBottomColor: theme.palette.background.paper,
				},
				"&.Mui-focusVisible": {
					outline: `2px solid ${theme.palette.primary.main}`,
					outlineOffset: "-2px",
				},
				"& .MuiTab-iconWrapper": {
					marginRight: theme.spacing(3),
					marginBottom: 0,
					color: theme.palette.neutral.icon,
				},
			}}
			{...props}
		/>
	);
};
