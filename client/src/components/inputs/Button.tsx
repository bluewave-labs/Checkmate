import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";

export const ButtonInput = ({ sx, ...props }: ButtonProps) => {
  const theme = useTheme();
  return (
    <Button
      {...props}
      sx={{
        textTransform: "none",
        height: 34,
        fontWeight: 400,
        borderRadius: 2,
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        boxShadow: "none",
        "&:hover": {
          boxShadow: "none",
          backgroundColor: props.color === "primary"
            ? theme.palette.tertiary.main
            : undefined,
        },
        ...sx,
      }}
    />
  );
};
