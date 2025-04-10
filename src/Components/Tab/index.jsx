import { Box, useTheme } from "@mui/material";
import { TabList } from "@mui/lab";
import PropTypes from "prop-types";

/**
 * CustomTabList component
 *
 * Wraps MUI's TabList inside a Box to apply consistent styling, specifically a bottom border,
 * while avoiding the default top, left, and right borders applied through global MuiTabs overrides.
 * This is used to match our tab layout across pages like Account and StatusPage.
 *
 * @component
 * @example
 * <CustomTabList value={value} onChange={handleChange}>
 *   <Tab label="General" value="general" />
 *   <Tab label="Settings" value="settings" />
 * </CustomTabList>
 *
 * @param {string} value - The currently selected tab's value.
 * @param {function} onChange - Callback when a different tab is selected.
 * @param {React.ReactNode} children - Tab components to render inside the TabList.
 * @param {object} props - Additional props passed to the TabList component.
 */

const CustomTabList = ({ value, onChange, children, ...props }) => {
	const theme = useTheme();

	return (
		<Box
			sx={{
				borderBottom: `1px solid ${theme.palette.primary.lowContrast}`,
				"& .MuiTabs-root": { height: "fit-content", minHeight: "0" },
			}}
		>
			<TabList value={value} onChange={onChange} {...props}>
				{children}
			</TabList>
		</Box>
	);
};

CustomTabList.propTypes = {
	value: PropTypes.string,
	onChange: PropTypes.func,
	children: PropTypes.node,
};

export default CustomTabList;
