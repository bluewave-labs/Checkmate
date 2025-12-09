import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { setSidebarOpen } from "@/features/uiSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/AppHooks";
import { useTranslation } from "react-i18next";

export const Logo = ({ sidebarOpen }: { sidebarOpen: boolean }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.sidebarOpen);

  return (
    <Stack
      pb={theme.spacing(6)}
      direction="row"
      alignItems="center"
      gap={theme.spacing(4)}
      onClick={() => {
        dispatch(setSidebarOpen(!isOpen));
      }}
      sx={{ cursor: "pointer" }}
    >
      <Typography
        minWidth={39}
        minHeight={theme.spacing(16)}
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        bgcolor={theme.palette.primary.main}
        borderRadius={theme.shape.borderRadius}
        color={theme.palette.primary.contrastText}
        fontSize={18}
      >
        C
      </Typography>
      <Box
        overflow={"hidden"}
        sx={{
          transition: "opacity 900ms ease, width 900ms ease",
          opacity: sidebarOpen ? 1 : 0,
          whiteSpace: "nowrap",
          width: sidebarOpen ? "100%" : 0,
        }}
      >
        {" "}
        <Typography lineHeight={1} mt={theme.spacing(2)} variant="h2">
          {t("common.appName")}
        </Typography>
      </Box>
    </Stack>
  );
};
