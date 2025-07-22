import { Box, useTheme } from "@mui/material";
import { TabList } from "@mui/lab";
import PropTypes from "prop-types";

/**
 * CustomTabList component
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
				marginBottom: theme.spacing(12),
				borderBottom: `1px solid ${theme.palette.primary.lowContrast}`,
				"& .MuiTabs-root": { height: "fit-content", minHeight: "0" },
			}}
		>
			<TabList
				value={value}
				onChange={onChange}
				{...props}
			>
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
