import Radio from "@mui/material/Radio";
import type { RadioProps } from "@mui/material/Radio";
import { useTheme } from "@mui/material/styles";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";

interface RadioInputProps extends RadioProps {}

export const RadioInput = ({ sx, ...props }: RadioInputProps) => {
	const theme = useTheme();
	const additionalSx = Array.isArray(sx) ? sx : sx ? [sx] : [];

	return (
		<Radio
			disableRipple
			{...props}
			sx={[
				{
					padding: theme.spacing(LAYOUT.XXS),
					color: theme.palette.divider,
					"& .MuiSvgIcon-root": {
						fontSize: "20px",
						transition: "none",
					},
					"&.Mui-checked": {
						color: theme.palette.primary.main,
					},
					"&.Mui-checked .MuiSvgIcon-root:last-of-type": {
						transform: "scale(0.6)",
					},
				},
				...additionalSx,
			]}
		/>
	);
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
				p: theme.spacing(SPACING.XL),
				m: theme.spacing(-SPACING.XL),
				borderRadius: theme.shape.borderRadius,

				"&:hover": {
					backgroundColor: theme.palette.background.paper,
				},
				"& .MuiButtonBase-root": {
					mr: theme.spacing(LAYOUT.SM),
				},
				"&:has(.Mui-focusVisible)": {
					backgroundColor: theme.palette.action.hover,
				},
			}}
		/>
	);
};
