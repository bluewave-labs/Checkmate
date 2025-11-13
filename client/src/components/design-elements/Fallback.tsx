import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import SkeletonCard from "@/components/design-elements/SkeletonCard";
import Typography from "@mui/material/Typography";
import { BulletPointCheck } from "@/components/design-elements";
import { Button } from "@/components/inputs";

import { useNavigate } from "react-router";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import type { BoxProps } from "@mui/material";
interface BaseFallbackProps extends BoxProps {
  children: React.ReactNode;
}

export const BaseFallback: React.FC<BaseFallbackProps> = ({
  children,
  ...props
}) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      margin={isSmall ? "inherit" : "auto"}
      marginTop={isSmall ? "33%" : "10%"}
      width={{
        sm: "90%",
        md: "70%",
        lg: "50%",
        xl: "40%",
      }}
      padding={theme.spacing(16)}
      bgcolor={theme.palette.primary.main}
      position="relative"
      border={1}
      borderColor={theme.palette.primary.lowContrast}
      borderRadius={theme.shape.borderRadius}
      overflow="hidden"
      sx={{
        borderStyle: "dashed",
      }}
      {...props}
    >
      <Box sx={{ marginTop: "100px" }}>
        <Stack
          alignItems="center"
          gap={theme.spacing(20)}
          sx={{
            width: "fit-content",
            margin: "auto",
            marginTop: 0,
          }}
        >
          <Box
            sx={{
              zIndex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
            }}
          >
            <SkeletonCard showHalo={true} />
          </Box>

          <Stack
            gap={theme.spacing(4)}
            alignItems="center"
            maxWidth={"300px"}
            zIndex={1}
          >
            {children}
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export const ErrorFallback = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => {
  const theme = useTheme();
  return (
    <BaseFallback>
      <Typography
        variant="h1"
        marginY={theme.spacing(4)}
        color={theme.palette.primary.contrastTextTertiary}
      >
        {title}
      </Typography>
      <Typography>{subtitle}</Typography>
    </BaseFallback>
  );
};

export const EmptyFallback = ({
  title,
  bullets,
  actionButtonText,
  actionLink,
}: {
  title: string;
  bullets: any;
  actionButtonText: string;
  actionLink: string;
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  return (
    <BaseFallback>
      <Stack gap={theme.spacing(10)} zIndex={1} alignItems="center">
        <Typography component="h1" color={theme.palette.primary.contrastText}>
          {title}
        </Typography>
        <Stack
          sx={{
            flexWrap: "wrap",
            gap: theme.spacing(2),
            maxWidth: "1100px",
            width: "100%",
          }}
        >
          {bullets?.map((bullet: string) => (
            <BulletPointCheck
              text={bullet}
              key={`${bullet}-${Math.random()}`}
            />
          ))}
        </Stack>
        <Stack>
          <Button
            variant="contained"
            color="accent"
            onClick={() => navigate(actionLink)}
          >
            {actionButtonText}
          </Button>
        </Stack>
      </Stack>
    </BaseFallback>
  );
};

export const EmptyMonitorFallback = ({
  page,
  title,
  bullets,
  actionButtonText,
  actionLink,
}: {
  page: string;
  title: string;
  bullets: any;
  actionButtonText: string;
  actionLink: string;
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  return (
    <BaseFallback>
      <Stack gap={theme.spacing(10)} zIndex={1} alignItems="center">
        <Typography component="h1" color={theme.palette.primary.contrastText}>
          {title}
        </Typography>
        <Stack
          sx={{
            flexWrap: "wrap",
            gap: theme.spacing(2),
            maxWidth: "1100px",
            width: "100%",
          }}
        >
          {bullets?.map((bullet: string, index: number) => (
            <BulletPointCheck
              text={bullet}
              key={`${(page + "Monitors").trim().split(" ")[0]}-${index}`}
            />
          ))}
        </Stack>
        <Stack>
          <Button
            variant="contained"
            color="accent"
            onClick={() => navigate(actionLink)}
          >
            {actionButtonText}
          </Button>
        </Stack>
      </Stack>
    </BaseFallback>
  );
};
