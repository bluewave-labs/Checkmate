import Stack from "@mui/material/Stack";
import { ButtonGroup, Button } from "@/components/inputs";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
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
          >
            All
          </Button>
        )}
        <Button
          variant="contained"
          onClick={() => setRange("2h")}
          loading={loading}
        >
          Recent
        </Button>
        <Button
          variant="contained"
          onClick={() => setRange("24h")}
          loading={loading}
        >
          Day
        </Button>
        <Button
          variant="contained"
          onClick={() => setRange("7d")}
          loading={loading}
        >
          7 days
        </Button>
        <Button
          variant="contained"
          onClick={() => setRange("30d")}
          loading={loading}
        >
          30 days
        </Button>
      </ButtonGroup>
    </Stack>
  );
};
