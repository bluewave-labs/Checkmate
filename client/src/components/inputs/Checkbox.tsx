import { forwardRef } from "react";
import Checkbox from "@mui/material/Checkbox";
import type { CheckboxProps } from "@mui/material/Checkbox";
import { Square, SquareCheck } from "lucide-react";
import { useTheme } from "@mui/material/styles";

type CheckboxInputProps = CheckboxProps & {
  label?: string;
};
export const CheckboxInput = forwardRef<HTMLInputElement, CheckboxInputProps>(
  function CheckboxInput({ sx, ...props }: CheckboxInputProps, ref: React.Ref<HTMLInputElement>) {
    const theme = useTheme();
    return (
      <Checkbox
        {...props}
        aria-label={props.label}
        slotProps={{
          input: {
            ref: ref,
          },
        }}
        icon={<Square size={16} strokeWidth={1.5} />}
        checkedIcon={<SquareCheck size={16} strokeWidth={1.5} />}
        sx={{
          padding: 0,
          color: theme.palette.primary.contrastTextTertiary,
          "&.Mui-checked": {
            color: theme.palette.accent.main,
          },
          "&:hover": { backgroundColor: "transparent" },
          "& svg": {
            stroke: "currentColor",
          },
          "& svg path, & svg line, & svg polyline, & svg rect": {
            stroke: "currentColor",
            fill: "none",
          },
          "&.Mui-checked svg rect": {
            fill: theme.palette.accent.main,
          },
          ...sx,
        }}
      />
    );
  }
);
