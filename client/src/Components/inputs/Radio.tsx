import Radio from "@mui/material/Radio";
import type { RadioProps } from "@mui/material/Radio";
import { useTheme } from "@mui/material/styles";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";

interface RadioInputProps extends RadioProps {}

export const RadioInput = ({ ...props }: RadioInputProps) => {
	return <Radio {...props} />;
};

export const RadioWithDescription = ({
	label,
	description,
	...props
}: RadioInputProps & { label: string; description: string }) => {
	const theme = useTheme();
	return (
		<FormControlLabel
			control={<RadioInput {...props} />}
			label={
				<>
					<Typography component="p">{label}</Typography>
					<Typography
						component="h6"
						color={theme.palette.text.secondary}
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
					backgroundColor: theme.palette.background.paper,
				},
				"& .MuiButtonBase-root": {
					mr: theme.spacing(6),
				},
			}}
		/>
	);
};
