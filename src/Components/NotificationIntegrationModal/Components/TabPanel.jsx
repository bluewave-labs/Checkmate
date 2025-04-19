import React from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import { useTheme } from "@emotion/react";

/**
 * TabPanel component that displays content for the selected tab.
 * 
 * @component
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The content to be displayed when this tab panel is selected.
 * @param {number} props.value - The currently selected tab value.
 * @param {number} props.index - The index of this specific tab panel.
 * @param {Object} props.other - Any additional props to be spread to the root element.
 * @returns {React.ReactElement|null} The rendered tab panel or null if not selected.
 */
function TabPanel({ children, value, index, ...other }) {
  const theme = useTheme(); 
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: theme.spacing(3) }}>
          {children}
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {

  children: PropTypes.node,
  
  index: PropTypes.number.isRequired,
  
  value: PropTypes.number.isRequired
};

export default TabPanel;