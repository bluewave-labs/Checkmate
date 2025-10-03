import Checkbox from "@mui/material/Checkbox";
import type { CheckboxProps } from "@mui/material/Checkbox";
import CheckboxOutline from "@/assets/icons/checkbox-outline.svg?react";
import CheckboxFilled from "@/assets/icons/checkbox-filled.svg?react";
import { useTheme } from "@mui/material/styles";
type CheckboxInputProps = CheckboxProps & {
	label?: string;
};

export const CheckboxInput: React.FC<CheckboxInputProps> = ({ label, ...props }) => {
	const theme = useTheme();
	return (
		<Checkbox
			{...props}
			icon={<CheckboxOutline />}
			checkedIcon={<CheckboxFilled />}
			sx={{
				"&:hover": { backgroundColor: "transparent" },
				"& svg": { width: theme.spacing(8), height: theme.spacing(8) },
			}}
		/>
	);
};
