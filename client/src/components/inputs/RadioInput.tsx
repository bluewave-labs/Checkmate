import Radio from "@mui/material/Radio";
import type { RadioProps } from "@mui/material/Radio";
import { useTheme } from "@mui/material/styles";
import { Circle, CircleDot } from "lucide-react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";

interface RadioInputProps extends RadioProps {}

export const RadioInput: React.FC<RadioInputProps> = ({ ...props }) => {
  const theme = useTheme();
  return (
    <Radio
      {...props}
      icon={<Circle size={16} strokeWidth={1.5} />}
      checkedIcon={<CircleDot size={14} strokeWidth={1.5} />}
      sx={{
        padding: 0,
        mt: theme.spacing(0.5),
        color: theme.palette.primary.contrastTextTertiary,
        "&.Mui-checked": {
          color: theme.palette.accent.main,
          "& svg circle": {
            fill: theme.palette.accent.main,
          },
        },
        "& .MuiSvgIcon-root": {
          fontSize: 16,
        },
        "& svg": {
          stroke: "currentColor",
        },
        "& svg path, & svg line, & svg polyline, & svg rect, & svg circle": {
          stroke: "currentColor",
          fill: "none",
        },
      }}
    />
  );
};

export const RadioWithDescription: React.FC<
  RadioInputProps & { label: string; description: string }
> = ({ label, description, ...props }) => {
  const theme = useTheme();
  return (
    <FormControlLabel
      control={<RadioInput {...props} />}
      label={
        <>
          <Typography component="p">{label}</Typography>
          <Typography
            component="h6"
            color={theme.palette.primary.contrastTextSecondary}
          >
            {description}
          </Typography>
        </>
      }
      sx={{
        alignItems: "flex-start",
        p: theme.spacing(2.5),
        m: theme.spacing(-2.5),
        borderRadius: theme.shape.borderRadius,

        "&:hover": {
          backgroundColor: theme.palette.tertiary.main,
        },
        "& .MuiButtonBase-root": {
          p: 0,
          mr: theme.spacing(6),
        },
      }}
    />
  );
};
