import Tooltip from "@mui/material/Tooltip";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

export interface NavData {
  name: string;
  icon: React.ReactElement;
}

export const NavItem = ({
  item,
  sidebarOpen,
  selected,
  onClick,
}: {
  item: NavData;
  sidebarOpen: boolean;
  selected: boolean;
  onClick: (event: React.MouseEvent) => void;
}) => {
  const theme = useTheme();
  const iconStroke = selected
    ? theme.palette.accent.main
    : theme.palette.primary.contrastTextTertiary;

  const buttonBgColor = selected ? theme.palette.secondary.main : "transparent";
  const buttonBgHoverColor = selected
    ? theme.palette.secondary.main
    : theme.palette.tertiary.main;
  const fontWeight = selected ? 600 : 400;
  return (
    <Tooltip
      placement="right"
      title={sidebarOpen ? "" : item.name}
      slotProps={{
        popper: {
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, -16],
              },
            },
          ],
        },
      }}
      disableInteractive
    >
      <ListItemButton
        sx={{
          backgroundColor: buttonBgColor,
          backgroundImage: selected
            ? `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`
            : "none",
          border: 1,
          borderColor: selected ? theme.palette.primary.veryLowContrast : "transparent",
          "&:hover": {
            backgroundColor: buttonBgHoverColor,
            backgroundImage: selected
              ? `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`
              : "none",
          },
          height: 32,
          gap: theme.spacing(4),
          borderRadius: theme.shape.borderRadius,
          px: theme.spacing(4),
          pl: theme.spacing(5),
        }}
        onClick={onClick}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            "& svg": {
              height: 16,
              width: 16,
              opacity: 0.81,
              transition: "stroke 0.2s ease",
            },
            "& svg path, & svg line, & svg polyline, & svg rect, & svg circle": {
              stroke: iconStroke,
            },
            ".MuiListItemButton-root:hover &": {
              "& svg path, & svg line, & svg polyline, & svg rect, & svg circle": {
                stroke: theme.palette.accent.main,
              },
            },
          }}
        >
          {item.icon}
        </ListItemIcon>
        <Box
          sx={{
            overflow: "hidden",
            transition: "opacity 900ms ease",
            opacity: sidebarOpen ? 1 : 0,
            whiteSpace: "nowrap",
          }}
        >
          <Typography
            variant="body1"
            color={theme.palette.primary.contrastText}
            sx={{
              fontWeight: fontWeight,
              opacity: 0.9,
            }}
          >
            {item.name}
          </Typography>
        </Box>
      </ListItemButton>
    </Tooltip>
  );
};
