import React from "react";
import { Box } from "@mui/material";
import { useTheme } from "@emotion/react";

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

export default TabPanel;