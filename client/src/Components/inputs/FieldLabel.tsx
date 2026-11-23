import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { LAYOUT } from "@/Utils/Theme/constants";
import { fontWeights } from "@/Utils/Theme/Palette";

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
				fontWeight: fontWeights.medium,
				color: theme.palette.text.secondary,
				marginBottom: theme.spacing(LAYOUT.XXS),
				display: "block",
			}}
		>
			{children}
			{required && (
				<span
					style={{
						color: theme.palette.error.main,
						marginLeft: theme.spacing(LAYOUT.XXS),
					}}
				>
					*
				</span>
			)}
		</Typography>
	);
};
