import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";

export const ButtonInput: React.FC<ButtonProps> = ({ sx, ...props }) => {
	return (
		<Button
			{...props}
			sx={{ textTransform: "none", height: 34, fontWeight: 400, borderRadius: 2, ...sx }}
		/>
	);
};
