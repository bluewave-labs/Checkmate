import IconButton from "@mui/material/IconButton";
import { ArrowRight } from "@/components/arrows/ArrowRight";
import { ArrowLeft } from "@/components/arrows/ArrowLeft";
import { useTheme } from "@mui/material/styles";
import { setSidebarOpen } from "@/features/uiSlice";
import { useAppDispatch } from "@/hooks/AppHooks";

export const CollapseButton = ({ sidebarOpen }: { sidebarOpen: boolean }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const arrowIcon = sidebarOpen ? (
    <ArrowLeft
      height={theme.spacing(8)}
      width={theme.spacing(8)}
      color={theme.palette.text.secondary}
    />
  ) : (
    <ArrowRight
      height={theme.spacing(8)}
      width={theme.spacing(8)}
      color={theme.palette.text.secondary}
    />
  );

  return (
    <IconButton
      sx={{
        position: "absolute",
        /* TODO 60 is a magic number. if logo chnges size this might break */
        top: 60,
        right: 0,
        transform: `translate(50%, 0)`,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        p: theme.spacing(2.5),

        "&:focus": { outline: "none" },
        "&:hover": {
          backgroundColor: theme.palette.action.hover,
          borderColor: theme.palette.divider,
        },
      }}
      onClick={() => {
        dispatch(setSidebarOpen(!sidebarOpen));
      }}
    >
      {arrowIcon}
    </IconButton>
  );
};
