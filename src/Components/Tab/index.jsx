import { Box, useTheme } from "@mui/material";
import { TabList } from "@mui/lab";
import PropTypes from "prop-types";

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
