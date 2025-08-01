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

	const controlledValue = value === undefined ? [] : value; // Ensure value is always treated as an array for controlled component purposes

	return (
		<FormControl
			sx={{ 
				minWidth: "10%",
				display: "flex",
				alignItems: "center"
			}}
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
				value={controlledValue}
				onChange={onChange}
				sx={{
					display: "flex",
					alignItems: "center"
				}}
				renderValue={(selected) => {
					if (!selected?.length) {
						return header;
					}

					return (
						header +
						" | " +
						selected
							.map((value) => options.find((option) => option.value === value)?.label)
							.filter(Boolean)
							.join(", ")
					);
				}}
				MenuProps={{
					anchorOrigin: {
						vertical: "bottom",
						horizontal: "left",
					},
					transformOrigin: {
						vertical: "top",
						horizontal: "left",
					},
				}}
			>
				{options.map((option) => (
					<MenuItem
						key={option.value}
						value={option.value}
						sx={{
							height: theme.spacing(17),
							padding: 0,
							display: "flex",
							alignItems: "center",
						}}
					>
						<Checkbox
							checked={controlledValue.includes(option.value)}
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
