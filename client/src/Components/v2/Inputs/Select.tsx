import { Typography, Select } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import { forwardRef } from "react";
import type { SelectProps } from "@mui/material/Select";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
type ItemId = string | number;
interface SelectItem {
	_id: ItemId;
	name: string;
}
export type CustomSelectProps = SelectProps<ItemId> & {
	items: SelectItem[];
	placeholder?: string;
	isHidden?: boolean;
	hasError?: boolean;
};

export const SelectInput = forwardRef<HTMLDivElement, CustomSelectProps>(
	function SelectInput(
		{ items, placeholder, isHidden = false, hasError = false, ...props },
		ref
	) {
		return (
			<Select
				sx={{
					"& .MuiSelect-select": {
						padding: "0",
					},
				}}
				error={hasError}
				ref={ref}
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
			</Select>
		);
	}
);
SelectInput.displayName = "SelectInput";
