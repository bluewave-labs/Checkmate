import { Typography, Select } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import type { SelectProps } from "@mui/material/Select";
import { useTheme } from "@mui/material/styles";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

export const SelectInput: React.FC<SelectProps> = ({ ...props }) => {
	const theme = useTheme();
	return (
		<Select
			{...props}
			sx={{
				height: "34px",
				"& .MuiOutlinedInput-notchedOutline": {
					borderRadius: theme.shape.borderRadius,
					borderColor: theme.palette.primary.lowContrast,
				},
				"&:hover .MuiOutlinedInput-notchedOutline": {
					borderColor: theme.palette.primary.lowContrast,
				},
			}}
		/>
	);
};

type ItemTypes = string | number;
interface SelectItem {
	_id: ItemTypes;
	name: string;
}
export type CustomSelectProps = SelectProps & {
	items: SelectItem[];
	placeholder?: string;
	isHidden?: boolean;
	hasError?: boolean;
};

export const SelectFromItems: React.FC<CustomSelectProps> = ({
	items,
	placeholder,
	isHidden = false,
	hasError = false,
	...props
}) => {
	return (
		<SelectInput
			error={hasError}
			IconComponent={KeyboardArrowDownIcon}
			displayEmpty
			MenuProps={{ disableScrollLock: true }}
			renderValue={(selected) => {
				if (!selected) {
					return (
						<Typography
							noWrap
							color="text.secondary"
						>
							{placeholder ?? ""}
						</Typography>
					);
				}
				const selectedItem = items.find((item) => item._id === selected);
				const displayName = selectedItem ? selectedItem.name : placeholder;
				return (
					<Typography
						noWrap
						title={displayName}
					>
						{displayName}
					</Typography>
				);
			}}
			{...props}
		>
			{items.map((item) => (
				<MenuItem
					key={item._id}
					value={item._id}
				>
					{item.name}
				</MenuItem>
			))}
		</SelectInput>
	);
};

SelectInput.displayName = "SelectInput";
SelectFromItems.displayName = "SelectFromItems";
