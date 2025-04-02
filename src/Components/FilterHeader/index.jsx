import { Checkbox, FormControl, ListItemText, MenuItem, Select } from "@mui/material";
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

/**
 * A reusable filter header component that displays a dropdown menu with selectable options.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.header - The header text to display when no options are selected.
 * @param {Array} props.options - An array of options to display in the dropdown menu. Each option should have a `value` and `label`.
 * @param {Array} [props.value] - The currently selected values.
 * @param {Function} props.onChange - The callback function to handle changes in the selected values.
 * @param {boolean} [props.multiple=true] - Whether multiple options can be selected.
 * @returns {JSX.Element} The rendered FilterHeader component.
 */

const FilterHeader = ({ header, options, value, onChange, multiple = true }) => {
	const theme = useTheme();

	return (
		<FormControl
			sx={{ m: theme.spacing(2), minWidth: "10%" }}
			size="small"
		>
			<Select
				multiple={multiple}
				IconComponent={(props) => (
					<AddCircleOutlineIcon
						{...props}
						sx={{ fontSize: "medium" }}
					/>
				)}
				displayEmpty
				value={value ?? []}
				onChange={onChange}
				renderValue={(selected) => {
					if (!selected?.length) {
						return header;
					}

					return selected
						.map((value) => options.find((option) => option.value === value)?.label)
						.filter(Boolean)
						.join(", ");
				}}
			>
				{options.map((option) => (
					<MenuItem
						key={option.value}
						value={option.value}
					>
						<Checkbox
							checked={value?.includes(option.value)}
							size="small"
						/>
						<ListItemText primary={option.label} />
					</MenuItem>
				))}
			</Select>
		</FormControl>
	);
};

FilterHeader.propTypes = {
	header: PropTypes.string.isRequired,
	options: PropTypes.arrayOf(
		PropTypes.shape({
			value: PropTypes.string.isRequired,
			label: PropTypes.string.isRequired,
		})
	).isRequired,
	value: PropTypes.arrayOf(PropTypes.string),
	onChange: PropTypes.func.isRequired,
	multiple: PropTypes.bool,
};

export default FilterHeader;
