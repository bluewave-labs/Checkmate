import MuiTab from "@mui/material/Tab";
import type { TabProps } from "@mui/material/Tab";
import { useTheme } from "@mui/material/styles";
interface CustomTabProps extends TabProps {}

export const Tab = (props: CustomTabProps) => {
  const theme = useTheme();
  return (
    <MuiTab
      disableRipple
      iconPosition="start"
      sx={{
        textTransform: "none",
        fontSize: 14,
        fontWeight: 500,
        minHeight: 34,
        padding: theme.spacing(1, 0),
        paddingBottom: 0,
        minWidth: "auto",
        alignItems: "flex-start",
        color: theme.palette.primary.contrastTextTertiary,
        "&.Mui-selected": {
          color: theme.palette.accent.main,
          fontWeight: 600,
        },
        "&:hover": {
          color: theme.palette.primary.contrastTextSecondary,
        },
        "& .MuiTab-iconWrapper": {
          marginRight: theme.spacing(2),
          marginBottom: 0,
        },
      }}
      {...props}
    />
  );
};
