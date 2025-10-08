import ButtonGroup from "@mui/material/ButtonGroup";
import type { ButtonGroupProps } from "@mui/material/ButtonGroup";
export const ButtonGroupInput: React.FC<ButtonGroupProps> = ({
	orientation,
	...props
}) => {
	return (
		<ButtonGroup
			orientation={orientation}
			{...props}
		/>
	);
};
