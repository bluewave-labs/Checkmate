import Stack from "@mui/material/Stack";
import { FieldLabel } from "./FieldLabel";
import { useTheme } from "@mui/material/styles";

interface FormFieldProps {
  label?: string;
  required?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  children,
  htmlFor,
}) => {
  const theme = useTheme();

  return (
    <Stack spacing={theme.spacing(2)}>
      {label && (
        <FieldLabel required={required} htmlFor={htmlFor}>
          {label}
        </FieldLabel>
      )}
      {children}
    </Stack>
  );
};
