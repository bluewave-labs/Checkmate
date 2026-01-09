import Stack from "@mui/material/Stack";
import { SegmentedControl } from "@/components/inputs";
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

  const options = [
    ...(all ? [{ value: "all", label: t("common.buttons.range.all") }] : []),
    { value: "1h", label: t("common.buttons.range.recent") },
    { value: "24h", label: t("common.buttons.range.day") },
    { value: "7d", label: t("common.buttons.range.week") },
    { value: "30d", label: t("common.buttons.range.month") },
  ];

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
      <SegmentedControl
        options={options}
        value={range}
        onChange={(value) => setRange(value)}
        loading={loading}
      />
    </Stack>
  );
};
