import MuiFormControlLabel from "@mui/material/FormControlLabel";
import type { FormControlLabelProps } from "@mui/material/FormControlLabel";

export const FormControlLabel: React.FC<FormControlLabelProps> = ({
  ...props
}) => {
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
