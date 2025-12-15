import MuiFormControlLabel from "@mui/material/FormControlLabel";
import type { FormControlLabelProps } from "@mui/material/FormControlLabel";

export const FormControlLabel = ({ ...props }: FormControlLabelProps) => {
  return (
    <MuiFormControlLabel
      {...props}
      sx={{
        "& .MuiFormControlLabel-label": {
          lineHeight: 1,
        },
      }}
    />
  );
};
