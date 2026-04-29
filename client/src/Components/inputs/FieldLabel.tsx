import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

interface FieldLabelProps {
	children: React.ReactNode;
	required?: boolean;
	htmlFor?: string;
}

export const FieldLabel = ({ children, required = false, htmlFor }: FieldLabelProps) => {
	const theme = useTheme();
	if (children === " ") {
		children = "\u00A0";
	}
	return (
		<Typography
			component="label"
			variant="body1"
			htmlFor={htmlFor}
			sx={{
				fontWeight: 500,
				color: theme.palette.text.secondary,
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
