import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Info } from "lucide-react";

interface InfoBoxProps {
  title: string;
  description: string;
}

export const InfoBox: React.FC<InfoBoxProps> = ({ title, description }) => {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      spacing={theme.spacing(4)}
      sx={{
        padding: theme.spacing(6),
        backgroundColor:
          theme.palette.mode === "dark"
            ? "rgba(59, 130, 246, 0.1)"
            : "rgba(59, 130, 246, 0.05)",
        borderRadius: theme.shape.borderRadius,
        borderLeft: `4px solid ${theme.palette.accent.main}`,
      }}
    >
      <Info
        size={24}
        strokeWidth={1.5}
        style={{
          color: theme.palette.accent.main,
          flexShrink: 0,
          marginTop: theme.spacing(1),
        }}
      />
      <Stack spacing={theme.spacing(4)}>
        <Typography variant="h2" sx={{ color: theme.palette.accent.main }}>
          {title}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            lineHeight: 1.7,
            color: theme.palette.primary.contrastTextSecondary,
          }}
        >
          {description}
        </Typography>
      </Stack>
    </Stack>
  );
};
