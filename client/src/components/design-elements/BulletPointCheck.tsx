import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Check } from "lucide-react";
import { useTheme } from "@mui/material/styles";

export const BulletPointCheck = ({
  text,
  variant = "info",
}: {
  text: string;
  noHighlightText?: string;
  variant?: "success" | "error" | "info";
}) => {
  const theme = useTheme();
  const colors: Record<string, string | undefined> = {
    success: theme.palette.success.main,
    error: theme.palette.error.main,
    info: theme.palette.primary.contrastTextSecondary,
  };

  return (
    <Stack
      direction="row"
      className="check"
      gap={theme.spacing(6)}
      alignItems="center"
    >
      <Check
        size={16}
        strokeWidth={1.5}
        style={{
          flexShrink: 0,
        }}
      />
      <Typography
        component="span"
        color={
          variant === "info"
            ? theme.palette.primary.contrastTextSecondary
            : colors[variant]
        }
        fontWeight={450}
        sx={{
          opacity: 0.9,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </Typography>
    </Stack>
  );
};
