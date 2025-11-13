import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import type { SxProps } from "@mui/material/styles";

type BaseBoxProps = React.PropsWithChildren<{ sx?: SxProps }>;

export const BaseBox: React.FC<BaseBoxProps> = ({ children, sx }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        border: 1,
        borderStyle: "solid",
        borderColor: theme.palette.primary.lowContrast,
        borderRadius: theme.shape.borderRadius,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};
