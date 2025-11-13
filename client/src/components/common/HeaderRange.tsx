import Stack from "@mui/material/Stack";
import { ButtonGroup, Button } from "@/components/inputs";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
export const HeaderRange = ({
  range,
  setRange,
  loading,
}: {
  range: string;
  setRange: Function;
  loading: boolean;
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
      <Typography variant="body2">{`Showing statistics for past ${range}`}</Typography>
      <ButtonGroup
        orientation={isSmall ? "vertical" : "horizontal"}
        fullWidth={isSmall}
        variant="contained"
        color={"primary"}
      >
        <Button
          color={range === "2h" ? "secondary" : "primary"}
          onClick={() => setRange("2h")}
          loading={loading}
        >
          Recent
        </Button>
        <Button
          color={range === "24h" ? "secondary" : "primary"}
          onClick={() => setRange("24h")}
          loading={loading}
        >
          Day
        </Button>
        <Button
          color={range === "7d" ? "secondary" : "primary"}
          onClick={() => setRange("7d")}
          loading={loading}
        >
          7 days
        </Button>
        <Button
          color={range === "30d" ? "secondary" : "primary"}
          onClick={() => setRange("30d")}
          loading={loading}
        >
          30 days
        </Button>
      </ButtonGroup>
    </Stack>
  );
};
