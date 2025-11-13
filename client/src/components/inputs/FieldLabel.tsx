import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

interface FieldLabelProps {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}

export const FieldLabel: React.FC<FieldLabelProps> = ({
  children,
  required = false,
  htmlFor,
}) => {
  const theme = useTheme();

  return (
    <Typography
      component="label"
      htmlFor={htmlFor}
      sx={{
        fontSize: "14px",
        fontWeight: 500,
        color: theme.palette.primary.contrastTextSecondary,
        marginBottom: theme.spacing(2),
        display: "block",
      }}
    >
      {children}
      {required && (
        <span
          style={{
            color: theme.palette.error.main,
            marginLeft: theme.spacing(2),
          }}
        >
          *
        </span>
      )}
    </Typography>
  );
};
