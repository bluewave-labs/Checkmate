import Box, { type BoxProps } from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

export const BaseBox = ({ sx, ...rest }: BoxProps) => {
  const theme = useTheme();
  return (
    <Box
      {...rest}
      sx={{
        backgroundColor: theme.palette.primary.main,
        border: 1,
        borderStyle: "solid",
        borderColor: theme.palette.primary.lowContrast,
        borderRadius: theme.shape.borderRadius,
        ...sx,
      }}
    />
  );
};
