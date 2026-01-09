import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

export interface SegmentedControlOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
}

export const SegmentedControl = ({
  options,
  value,
  onChange,
  loading = false,
}: SegmentedControlProps) => {
  const theme = useTheme();

  const itemHeight = 34;
  const px = 8; // 2x the original padding for generous horizontal spacing

  return (
    <Box
      sx={{
        display: "inline-flex",
        bgcolor: theme.palette.grey[100],
        borderRadius: "4px",
        p: "3px",
        opacity: loading ? 0.6 : 1,
        pointerEvents: loading ? "none" : "auto",
      }}
    >
      {options.map((opt) => (
        <Box
          key={opt.value}
          onClick={() => !opt.disabled && onChange(opt.value)}
          sx={{
            px: px,
            height: itemHeight - 6,
            display: "flex",
            alignItems: "center",
            borderRadius: "4px",
            cursor: opt.disabled ? "not-allowed" : "pointer",
            fontWeight: 500,
            fontSize: 13,
            transition: "all 150ms ease",
            bgcolor: value === opt.value ? "#fff" : "transparent",
            color:
              opt.disabled
                ? theme.palette.text.disabled
                : value === opt.value
                  ? theme.palette.text.primary
                  : theme.palette.text.secondary,
            boxShadow: value === opt.value ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            "&:hover": {
              color: opt.disabled ? theme.palette.text.disabled : theme.palette.text.primary,
            },
          }}
        >
          {opt.label}
        </Box>
      ))}
    </Box>
  );
};
