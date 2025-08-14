import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import { MenuItem, Select as MuiSelect, Stack, Typography } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FieldWrapper from "../FieldWrapper";

import "./index.css";

/**
 * @component
 * @param {object} props
 * @param {string} props.id - The ID attribute for the select element.
 * @param {string} props.placeholder - The label of the select element.
 * @param {string} props.placeholder - The placeholder text when no option is selected.
 * @param {boolean} props.isHidden - Whether the placeholder should be hidden.
 * @param {(string | number | boolean)} props.value - The currently selected value.
 * @param {object[]} props.items - The array of items to populate in the select dropdown.
 *    @param {(string | number | boolean)} props.items._id - The unique identifier of each item.
 *    @param {string} props.items.name - The display name of each item.
 * @param {function} props.onChange - The function to handle onChange event.
 * @param {object} props.sx - The custom styles object for MUI Select component.
 * @param {number} props.maxWidth - Maximum width in pixels for the select component. Enables responsive text truncation.
 * @returns {JSX.Element}
 *
 * @example
 * const frequencies = [
 * { _id: 1, name: "1 minute" },
 * { _id: 2, name: "2 minutes" },
 * { _id: 3, name: "3 minutes" },
 * ];
 *
 * <Select
 *  id="frequency-id"
 *  name="my-name"
 *  label="Check frequency"
 *  placeholder="Select frequency"
 *  value={value}
 *  onChange={handleChange}
 *  items={frequencies}
 * />
 */

const Select = ({
	id,
	label,
	placeholder,
	isHidden,
	value,
	items,
	onChange,
	onBlur,
	sx,
	error = false,
	name = "",
	labelControlSpacing = 6,
	maxWidth,
	//FieldWrapper's props
	labelMb,
	labelFontWeight,
	labelVariant,
	labelSx = {},
	fieldWrapperSx = {},
}) => {
	const theme = useTheme();
	const itemStyles = {
		fontSize: "var(--env-var-font-size-medium)",
		color: theme.palette.primary.contrastTextTertiary,
		borderRadius: theme.shape.borderRadius,
		margin: theme.spacing(2),
	};

	const responsiveMaxWidth = {
		xs: `${maxWidth * 0.5}px`,
		sm: `${maxWidth * 0.75}px`,
		md: `${maxWidth * 0.9}px`,
		lg: `${maxWidth}px`,
	};

	return (
		<FieldWrapper
			label={label}
			labelMb={labelMb}
			labelVariant={labelVariant}
			labelFontWeight={labelFontWeight}
			labelSx={labelSx}
			gap={labelControlSpacing}
			sx={{
				...fieldWrapperSx,
			}}
		>
			<MuiSelect
				className="select-component"
				value={value}
				onChange={onChange}
				onBlur={onBlur}
				displayEmpty
				error={error}
				name={name}
				inputProps={{ id: id }}
				IconComponent={KeyboardArrowDownIcon}
				MenuProps={{ disableScrollLock: true }}
				sx={{
					fontSize: 13,
					minWidth: "125px",
					...(maxWidth && { maxWidth: responsiveMaxWidth }),
					"& fieldset": {
						borderRadius: theme.shape.borderRadius,
						borderColor: theme.palette.primary.lowContrast,
					},
					"&:not(.Mui-focused):hover fieldset": {
						borderColor: theme.palette.primary.lowContrast,
					},
					"& svg path": {
						fill: theme.palette.primary.contrastTextTertiary,
					},
					"& .MuiSelect-select": {
						padding: "0",
						minHeight: "34px",
						display: "flex",
						alignItems: "center",
						lineHeight: 1,
					},
					...sx,
				}}
				renderValue={(selected) => {
					const selectedItem = items.find((item) => item._id === selected);
					const displayName = selectedItem ? selectedItem.name : placeholder;
					return (
						<Typography
							sx={{
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
							title={displayName}
						>
							{displayName}
						</Typography>
					);
				}}
			>
				{placeholder && (
					<MenuItem
						className="select-placeholder"
						value="0"
						sx={{
							display: isHidden ? "none" : "flex",
							visibility: isHidden ? "none" : "visible",
							...itemStyles,
						}}
					>
						{placeholder}
					</MenuItem>
				)}
				{items.map((item) => (
					<MenuItem
						value={item._id}
						key={`${id}-${item._id}`}
						sx={{
							...itemStyles,
						}}
					>
						{item.name}
					</MenuItem>
				))}
			</MuiSelect>
		</FieldWrapper>
	);
};

Select.propTypes = {
	id: PropTypes.string,
	name: PropTypes.string,
	label: PropTypes.string,
	placeholder: PropTypes.string,
	isHidden: PropTypes.bool,
	error: PropTypes.bool,
	value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool])
		.isRequired,
	items: PropTypes.arrayOf(
		PropTypes.shape({
			_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool])
				.isRequired,

			name: PropTypes.string.isRequired,
		})
	).isRequired,
	onChange: PropTypes.func.isRequired,
	onBlur: PropTypes.func,
	sx: PropTypes.object,
	labelControlSpacing: PropTypes.number,
	/**
	 * Maximum width in pixels. Used to control text truncation and element width.
	 * Responsive breakpoints will be calculated as percentages of this value.
	 */
	maxWidth: PropTypes.number,
};

export default Select;
