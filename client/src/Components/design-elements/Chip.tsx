import MuiChip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material";
interface ChipProps {
	text: string;
	color?: string;
}

export const Chip = ({ text, color }: ChipProps) => {
	const theme = useTheme();
	const textColor = color
		? theme.palette.getContrastText(color)
		: theme.palette.text.primary;
	return (
		<MuiChip
			size="small"
			label={
				<Typography
					variant="body2"
					color={textColor}
				>
					{text}
				</Typography>
			}
			sx={{
				backgroundColor: color,
			}}
		/>
	);
};
