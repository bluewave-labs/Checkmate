import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
export const ButtonInput: React.FC<ButtonProps> = ({ ...props }) => {
	const theme = useTheme();
	return (
		<Button
			{...props}
			sx={{ textTransform: "none", height: 34, fontWeight: 400, borderRadius: 2 }}
		/>
	);
};
