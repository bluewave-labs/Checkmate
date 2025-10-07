import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";

export const ButtonInput: React.FC<ButtonProps> = ({ filled, sx, ...props }) => {
	return (
		<Button
			filled={filled}
			{...props}
			sx={{ textTransform: "none", height: 34, fontWeight: 400, borderRadius: 2, ...sx }}
		/>
	);
};
