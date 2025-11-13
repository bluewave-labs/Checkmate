import type { IMonitor } from "@/types/monitor";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PulseDot, Dot } from "@/components/design-elements";
import { getStatusColor, formatUrl } from "@/utils/MonitorUtils";
import { useTheme } from "@mui/material/styles";
import prettyMilliseconds from "pretty-ms";
import { typographyLevels } from "@/theme/palette";
import useMediaQuery from "@mui/material/useMediaQuery";
export const MonitorStatus = ({ monitor }: { monitor: IMonitor }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));

  if (!monitor) {
    return null;
  }
  return (
    <Stack>
      <Typography
        fontSize={typographyLevels.xl}
        fontWeight={500}
        color={theme.palette.primary.contrastText}
        overflow={"hidden"}
        textOverflow={"ellipsis"}
        whiteSpace={"nowrap"}
        maxWidth={
          isSmall ? "100%" : "calc((100vw - var(--env-var-width-2)) / 2)"
        }
      >
        {monitor.name}
      </Typography>
      <Stack direction="row" alignItems={"center"} gap={theme.spacing(4)}>
        <PulseDot color={getStatusColor(monitor.status, theme)} />
        <Typography
          color={theme.palette.primary.contrastTextSecondary}
          fontSize={typographyLevels.l}
          fontWeight={"bolder"}
          fontFamily={"monospace"}
          overflow={"hidden"}
          textOverflow={"ellipsis"}
          whiteSpace={"nowrap"}
          maxWidth={
            isSmall ? "100%" : "calc((100vw - var(--env-var-width-2)) / 2)"
          }
        >
          {formatUrl(monitor?.url)}
        </Typography>
        {!isSmall && (
          <>
            <Dot />
            <Typography>
              Checking every{" "}
              {prettyMilliseconds(monitor?.interval, { verbose: true })}
            </Typography>
          </>
        )}
      </Stack>
    </Stack>
  );
};
