import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import type { ICheck } from "@/types/check";
import { HistogramResponseTimeTooltip } from "@/components/monitors/HistogramResponseTimeTooltip";
import { normalizeResponseTimes } from "@/utils/DataUtils";

export const HistogramResponseTime = ({ checks }: { checks: ICheck[] }) => {
  const theme = useTheme();
  const normalChecks = normalizeResponseTimes(checks, "responseTime");
  const BAR_WIDTH = { xs: theme.spacing(2.5), md: theme.spacing(4.5) };
  let data = Array<any>();

  if (!normalChecks || normalChecks.length === 0) {
    return null;
  }
  if (normalChecks.length !== 25) {
    const placeholders = Array(25 - normalChecks.length).fill("placeholder");
    data = [...normalChecks, ...placeholders];
  } else {
    data = normalChecks;
  }

  return (
    <Stack
      direction="row"
      flexWrap="nowrap"
      gap={theme.spacing(1.5)}
      height="50px"
      width="fit-content"
      onClick={(event) => event.stopPropagation()}
      sx={{
        cursor: "default",
      }}
    >
      {data.map((check, index) => {
        if (check === "placeholder") {
          return (
            <Box
              key={`${check}-${index}`}
              position="relative"
              width={BAR_WIDTH}
              height="100%"
              bgcolor={theme.palette.primary.veryLowContrast}
              sx={{
                borderRadius: theme.spacing(1.5),
              }}
            />
          );
        } else {
          return (
            <HistogramResponseTimeTooltip
              key={`${check}-${index}`}
              check={check}
            >
              <Box
                position="relative"
                height="100%"
                bgcolor={theme.palette.primary.veryLowContrast}
                width={BAR_WIDTH}
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
        }
      })}
    </Stack>
  );
};
