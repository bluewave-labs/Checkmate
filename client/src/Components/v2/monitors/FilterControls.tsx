import Stack from "@mui/material/Stack";
import { Select } from "@/Components/v2/inputs";
export const FilterControls = () => {
	return (
		<Stack direction="row">
			<Select placeholder="Type"></Select>
			<Select placeholder="Status" />
			<Select placeholder="Priority" />
		</Stack>
	);
};
