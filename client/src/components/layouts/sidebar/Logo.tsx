import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

export const Logo = ({ sidebarOpen }: { sidebarOpen: boolean }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Stack
      pt={theme.spacing(6)}
      pb={theme.spacing(12)}
      pl={theme.spacing(11)}
      direction="row"
      alignItems="center"
      gap={theme.spacing(4)}
      onClick={() => navigate("/")}
      sx={{ cursor: "pointer" }}
    >
      <Typography
        pl={theme.spacing("1px")}
        minWidth={theme.spacing(16)}
        minHeight={theme.spacing(16)}
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        bgcolor={theme.palette.accent.main}
        borderRadius={theme.shape.borderRadius}
        color={theme.palette.accent.contrastText}
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
        <Typography
          lineHeight={1}
          mt={theme.spacing(2)}
          color={theme.palette.primary.contrastText}
          variant="h2"
        >
          {t("common.appName")}
        </Typography>
      </Box>
    </Stack>
  );
};
