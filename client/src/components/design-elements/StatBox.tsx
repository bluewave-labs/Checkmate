import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { PaletteKey } from "@/theme/theme";
import { BaseBox, TooltipWithInfo } from "@/components/design-elements";
import type { SxProps } from "@mui/material";

type GradientBox = React.PropsWithChildren<{
  palette?: PaletteKey;
  sx?: SxProps;
}>;

export const GradientBox: React.FC<GradientBox> = ({
  children,
  palette,
  sx,
}) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  const bg = palette
    ? `linear-gradient(to bottom right, ${theme.palette[palette].main} 30%, ${theme.palette[palette].lowContrast} 70%)`
    : `linear-gradient(340deg, ${theme.palette.tertiary.main} 10%, ${theme.palette.primary.main} 45%)`;

  return (
    <BaseBox
      sx={{
        padding: `${theme.spacing(4)} ${theme.spacing(8)}`,
        width: isSmall
          ? `calc(50% - (1 * ${theme.spacing(8)} / 2))`
          : `calc(25% - (3 * ${theme.spacing(8)} / 4))`,

        background: bg,
        ...sx,
      }}
    >
      {children}
    </BaseBox>
  );
};

type StatBoxProps = React.PropsWithChildren<{
  title: string;
  subtitle: string;
  palette?: PaletteKey;
  sx?: SxProps;
  tooltip?: string;
}>;

export const StatBox: React.FC<StatBoxProps> = ({
  title,
  subtitle,
  palette,
  children,
  sx,
  tooltip,
}) => {
  const theme = useTheme();
  const textColor = palette ? theme.palette[palette].contrastText : "inherit";

  return (
    <GradientBox palette={palette} sx={sx}>
      <Stack>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: theme.spacing(2) }}
        >
          <Typography color={textColor}>{title}</Typography>
          {tooltip && (
            <TooltipWithInfo
              title={tooltip}
              iconColor={textColor as string}
              iconSize={14}
            />
          )}
        </Box>
        <Typography color={textColor}>{subtitle}</Typography>
        {children}
      </Stack>
    </GradientBox>
  );
};
