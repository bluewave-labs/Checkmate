import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import type { ICheck } from "@/types/check";
import { HistogramResponseTimeTooltip } from "@/components/monitors/HistogramResponseTimeTooltip";
import { normalizeResponseTimes } from "@/utils/DataUtils";

const BAR_HEIGHT = "50px";

export const HistogramStatusPage = ({ checks }: { checks: ICheck[] }) => {
  const theme = useTheme();
  const normalChecks = normalizeResponseTimes(checks, "responseTime");
  let data = Array<any>();

  if (!normalChecks || normalChecks.length === 0) {
    return null;
  }
  if (normalChecks.length !== 25) {
    const placeholders = Array(25 - normalChecks.length).fill({
      status: "placeholder",
    });
    data = [...normalChecks, ...placeholders];
  } else {
    data = normalChecks;
  }

  return (
    <Stack
      direction="row"
      spacing={"auto"}
      height={BAR_HEIGHT}
      onClick={(event) => event.stopPropagation()}
      sx={{
        cursor: "default",
      }}
    >
      {data.map((check, index) => {
        return (
          <HistogramResponseTimeTooltip key={`${check}-${index}`} check={check}>
            <Box
              position="relative"
              width={{
                xs: theme.spacing(2),
                sm: theme.spacing(6),
              }}
              bgcolor={theme.palette.primary.lowContrast}
              sx={{
                borderRadius: theme.spacing(1.5),
              }}
            >
              <Box
                position="absolute"
                bottom={0}
                width="100%"
                height={`${check.normalResponseTime}%`}
                bgcolor={
                  check.status === "up"
                    ? theme.palette.success.lowContrast
                    : theme.palette.error.lowContrast
                }
                sx={{
                  borderRadius: theme.spacing(1.5),
                  transition: "height 600ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </Box>
          </HistogramResponseTimeTooltip>
        );
      })}
    </Stack>
  );
};
