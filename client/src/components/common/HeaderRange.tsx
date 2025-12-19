import Stack from "@mui/material/Stack";
import { ButtonGroup, Button } from "@/components/inputs";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTranslation } from "react-i18next";
export const HeaderRange = ({
  range,
  setRange,
  loading,
  all = false,
}: {
  range: string;
  setRange: Function;
  loading: boolean;
  all?: boolean;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  return (
    <Stack
      gap={theme.spacing(9)}
      direction={isSmall ? "column" : "row"}
      alignItems={"center"}
      justifyContent="flex-end"
    >
      <Typography variant="body2">
        {range === "all" ? "Showing all" : `Showing past ${range}`}
      </Typography>
      <ButtonGroup
        orientation={isSmall ? "vertical" : "horizontal"}
        fullWidth={isSmall}
        color="secondary"
      >
        {all && (
          <Button
            variant="contained"
            onClick={() => setRange("all")}
            loading={loading}
            sx={
              range === "all"
                ? {
                    backgroundColor: theme.palette.secondary.dark,
                    color: theme.palette.secondary.contrastText,
                  }
                : undefined
            }
          >
            {t("common.buttons.range.all")}
          </Button>
        )}
        <Button
          variant="contained"
          onClick={() => setRange("1h")}
          loading={loading}
          sx={
            range === "1h"
              ? {
                  backgroundColor: theme.palette.secondary.dark,
                  color: theme.palette.secondary.contrastText,
                }
              : undefined
          }
        >
          {t("common.buttons.range.recent")}
        </Button>
        <Button
          variant="contained"
          onClick={() => setRange("24h")}
          loading={loading}
          sx={
            range === "24h"
              ? {
                  backgroundColor: theme.palette.secondary.dark,
                  color: theme.palette.secondary.contrastText,
                }
              : undefined
          }
        >
          {t("common.buttons.range.day")}
        </Button>
        <Button
          variant="contained"
          onClick={() => setRange("7d")}
          loading={loading}
          sx={
            range === "7d"
              ? {
                  backgroundColor: theme.palette.secondary.dark,
                  color: theme.palette.secondary.contrastText,
                }
              : undefined
          }
        >
          {t("common.buttons.range.week")}
        </Button>
        <Button
          variant="contained"
          onClick={() => setRange("30d")}
          loading={loading}
          sx={
            range === "30d"
              ? {
                  backgroundColor: theme.palette.secondary.dark,
                  color: theme.palette.secondary.contrastText,
                }
              : undefined
          }
        >
          {t("common.buttons.range.month")}
        </Button>
      </ButtonGroup>
    </Stack>
  );
};
