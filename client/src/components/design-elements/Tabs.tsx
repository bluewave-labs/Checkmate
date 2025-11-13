import MuiTabs from "@mui/material/Tabs";
import type { TabsProps } from "@mui/material/Tabs";
import { useTheme } from "@mui/material/styles";
interface CustomTabsProps extends TabsProps {}

export const Tabs = (props: CustomTabsProps) => {
  const theme = useTheme();
  return (
    <MuiTabs
      sx={{
        minHeight: 34,
        borderBottom: `1px solid ${theme.palette.primary.lowContrast}`,
        "& .MuiTabs-indicator": {
          backgroundColor: theme.palette.accent.main,
          height: 2,
          bottom: 0,
        },
        "& .MuiTabs-flexContainer": {
          gap: theme.spacing(16),
        },
      }}
      {...props}
    >
      {props.children}
    </MuiTabs>
  );
};
