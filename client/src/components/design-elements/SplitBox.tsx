import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
export const SplitBox = ({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  return (
    <Stack
      direction={isSmall ? "column" : "row"}
      bgcolor={theme.palette.background.paper}
      border={1}
      borderColor={theme.palette.divider}
      borderRadius={theme.spacing(2)}
    >
      <Box
        padding={theme.spacing(15)}
        borderRight={isSmall ? 0 : 1}
        borderBottom={isSmall ? 1 : 0}
        borderColor={theme.palette.divider}
        flex={0.7}
        sx={{
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(255, 255, 255, 0.01) 0%, rgba(255, 255, 255, 0.02) 100%)"
              : "linear-gradient(135deg, rgba(0, 0, 0, 0.01) 0%, rgba(0, 0, 0, 0.02) 100%)",
        }}
      >
        {left}
      </Box>
      <Box flex={1} padding={theme.spacing(15)}>
        {right}
      </Box>
    </Stack>
  );
};

export const ConfigBox = ({
  title,
  subtitle,
  leftContent,
  rightContent,
}: {
  title: string;
  subtitle: string;
  leftContent?: React.ReactNode;
  rightContent: React.ReactNode;
}) => {
  const theme = useTheme();
  return (
    <SplitBox
      left={
        <Stack spacing={theme.spacing(4)}>
          <Typography textTransform={"capitalize"} component="h2" variant="h2">
            {title}
          </Typography>
          <Typography component="p">{subtitle}</Typography>
          {leftContent}
        </Stack>
      }
      right={rightContent}
    />
  );
};
