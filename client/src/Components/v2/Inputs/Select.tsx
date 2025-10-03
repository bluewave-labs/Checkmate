import Select from "@mui/material/Select";
import type { SelectProps } from "@mui/material/Select";

export const SelectInput: React.FC<SelectProps> = ({ ...props }) => {
	return <Select {...props} />;
};
