import PropTypes from "prop-types";
import { FormControlLabel, Checkbox as MuiCheckbox } from "@mui/material";
import { useTheme } from "@emotion/react";
import CheckboxOutline from "../../../assets/icons/checkbox-outline.svg?react";
import CheckboxFilled from "../../../assets/icons/checkbox-filled.svg?react";
import "./index.css";

/**
 * Checkbox Component
 *
 * A customized checkbox component using Material-UI that supports custom sizing,
 * disabled states, and custom icons.
 *
 * @component
 * @param {Object} props - Component properties
 * @param {string} props.id - Unique identifier for the checkbox input
 * @param {string} [props.name] - Optional name attribute for the checkbox
 * @param {(string|React.ReactNode)} props.label - Label text or node for the checkbox
 * @param {('small'|'medium'|'large')} [props.size='medium'] - Size of the checkbox icon
 * @param {boolean} props.isChecked - Current checked state of the checkbox
 * @param {string} [props.value] - Optional value associated with the checkbox
 * @param {Function} [props.onChange] - Callback function triggered when checkbox state changes
 * @param {boolean} [props.isDisabled] - Determines if the checkbox is disabled
 *
 * @returns {React.ReactElement} Rendered Checkbox component
 *
 * @example
 * // Basic usage
 * <Checkbox
 *   id="terms-checkbox"
 *   label="I agree to terms"
 *   isChecked={agreed}
 *   onChange={handleAgree}
 * />
 *
 * @example
 * // With custom size and disabled state
 * <Checkbox
 *   id="advanced-checkbox"
 *   label="Advanced Option"
 *   size="large"
 *   isChecked={isAdvanced}
 *   isDisabled={!canModify}
 *   onChange={handleAdvancedToggle}
 * />
 */
const Checkbox = ({
	id,
	name,
	label,
	size = "medium",
	isChecked,
	value,
	onChange,
	isDisabled,
}) => {
	/* TODO move sizes to theme */
	const sizes = { small: "14px", medium: "16px", large: "18px" };
	const theme = useTheme();
	return (
		<FormControlLabel
			className="checkbox-wrapper"
			control={
				<MuiCheckbox
					checked={isDisabled ? false : isChecked}
					name={name}
					value={value}
					onChange={onChange}
					icon={<CheckboxOutline />}
					checkedIcon={<CheckboxFilled />}
					inputProps={{
						"aria-label": "controlled checkbox",
						id: id,
					}}
					sx={{
						"&:hover": { backgroundColor: "transparent" },
						"& svg": { width: sizes[size], height: sizes[size] },
					}}
				/>
			}
			label={label}
			disabled={isDisabled}
			sx={{
				borderRadius: theme.shape.borderRadius,
				p: theme.spacing(2.5),
				"& .MuiButtonBase-root": {
					width: theme.spacing(10),
					p: 0,
					mr: theme.spacing(6),
				},
				"&:not(:has(.Mui-disabled)):hover": {
					backgroundColor: theme.palette.tertiary.main,
				},
				"& span.MuiTypography-root": {
					fontSize: 13,
					color: theme.palette.primary.contrastTextTertiary,
				},
				".MuiFormControlLabel-label.Mui-disabled": {
					color: theme.palette.primary.contrastTextTertiary,
					opacity: 0.25,
				},
			}}
		/>
	);
};

Checkbox.propTypes = {
	id: PropTypes.string.isRequired,
	name: PropTypes.string,
	label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
	size: PropTypes.oneOf(["small", "medium", "large"]),
	isChecked: PropTypes.bool.isRequired,
	value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
	onChange: PropTypes.func,
	isDisabled: PropTypes.bool,
};

export default Checkbox;
