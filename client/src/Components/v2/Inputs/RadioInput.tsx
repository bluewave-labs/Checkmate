import Radio from "@mui/material/Radio";
import type { RadioProps } from "@mui/material/Radio";
import { useTheme } from "@mui/material/styles";
import RadioChecked from "@/assets/icons/radio-checked.svg?react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";

interface RadioInputProps extends RadioProps {}

export const RadioInput: React.FC<RadioInputProps> = ({ ...props }) => {
	const theme = useTheme();
	return (
		<Radio
			{...props}
			checkedIcon={<RadioChecked />}
			sx={{
				color: "transparent",
				boxShadow: `inset 0 0 0 1px ${theme.palette.secondary.main}`,
				"&:not(.Mui-checked)": {
					boxShadow: `inset 0 0 0 1px ${theme.palette.primary.contrastText}70`, // Use theme text color for the outline
				},
				mt: theme.spacing(0.5),
			}}
		/>
	);
};

export const RadioWithDescription: React.FC<
	RadioInputProps & { label: string; description: string }
> = ({ label, description, ...props }) => {
	const theme = useTheme();
	return (
		<FormControlLabel
			control={<RadioInput {...props} />}
			label={
				<>
					<Typography component="p">{label}</Typography>
					<Typography
						component="h6"
						color={theme.palette.primary.contrastTextSecondary}
					>
						{description}
					</Typography>
				</>
			}
			sx={{
				alignItems: "flex-start",
				p: theme.spacing(2.5),
				m: theme.spacing(-2.5),
				borderRadius: theme.shape.borderRadius,

				"&:hover": {
					backgroundColor: theme.palette.tertiary.main,
				},
				"& .MuiButtonBase-root": {
					p: 0,
					mr: theme.spacing(6),
				},
			}}
		/>
	);
};
