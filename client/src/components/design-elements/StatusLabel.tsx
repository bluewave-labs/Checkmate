import Box from "@mui/material/Box";
import { BaseBox } from "@/components/design-elements";
import type { MonitorStatus } from "@/types/monitor";

import { getStatusPalette, getValuePalette } from "@/utils/MonitorUtils";
import { useTheme } from "@mui/material/styles";

export const ValueTypes = ["positive", "negative", "neutral"] as const;
export type ValueType = (typeof ValueTypes)[number];

export const StatusLabel = ({
  status,
  isActive,
}: {
  status: MonitorStatus;
  isActive?: boolean;
}) => {
  const theme = useTheme();
  const palette = getStatusPalette(status);
  const transformedText =
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <BaseBox
      sx={{
        display: "inline-flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacing(3, 5),
        color: theme.palette[palette].main,
        borderColor:
          theme.palette.mode === "dark"
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(0, 0, 0, 0.08)",
      }}
    >
      <Box
        width={7}
        height={7}
        bgcolor={theme.palette[palette].lowContrast}
        borderRadius="50%"
        marginRight="5px"
      />
      {isActive === false ? "Paused" : transformedText}
    </BaseBox>
  );
};

export const ValueLabel = ({
  value,
  text,
}: {
  value: ValueType;
  text: string;
}) => {
  const theme = useTheme();
  const palette = getValuePalette(value);
  const transformedText =
    text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

  return (
    <BaseBox
      sx={{
        display: "inline-flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacing(3, 5),
        color: theme.palette[palette].main,
        borderColor:
          theme.palette.mode === "dark"
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(0, 0, 0, 0.08)",
      }}
    >
      <Box
        width={7}
        height={7}
        bgcolor={theme.palette[palette].lowContrast}
        borderRadius="50%"
        marginRight="5px"
      />
      {transformedText}
    </BaseBox>
  );
};
