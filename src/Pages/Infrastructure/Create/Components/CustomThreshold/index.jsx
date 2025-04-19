import { Box, Stack, Typography } from "@mui/material";
import TextInput from "../../../../../Components/Inputs/TextInput";
import Checkbox from "../../../../../Components/Inputs/Checkbox";
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";

/**
 * CustomThreshold Component
 *
 * A reusable component that renders a checkbox with an associated numeric input field
 * and an optional unit label. The input field can be enabled/disabled based on checkbox state.
 *
 * @component
 * @param {Object} props - Component properties
 * @param {string} [props.checkboxId] - Optional unique identifier for the checkbox
 * @param {string} [props.checkboxName] - Optional name attribute for the checkbox
 * @param {string} props.checkboxLabel - Label text for the checkbox
 * @param {boolean} props.isChecked - Current checked state of the checkbox
 * @param {Function} props.onCheckboxChange - Callback function when checkbox is toggled
 * @param {string} props.fieldId - Unique identifier for the input field
 * @param {string} [props.fieldName] - Optional name attribute for the input field
 * @param {string} props.fieldValue - Current value of the input field
 * @param {Function} props.onFieldChange - Callback function when input field value changes
 * @param {Function} props.onFieldBlur - Callback function when input field loses focus
 * @param {string} props.alertUnit - Unit label displayed next to the input field
 * @param {Object} props.errors - Object containing validation errors for the field
 * @param {Object} props.infrastructureMonitor - Infrastructure monitor configuration object
 *
 * @returns {React.ReactElement} Rendered CustomThreshold component
 *
 * @example
 * <CustomThreshold
 *   checkboxId="cpu-threshold"
 *   checkboxName="cpu_threshold"
 *   checkboxLabel="Enable CPU Threshold"
 *   isChecked={true}
 *   onCheckboxChange={handleCheckboxToggle}
 *   fieldId="cpu-threshold-value"
 *   fieldName="cpu_threshold_value"
 *   fieldValue="80"
 *   onFieldChange={handleFieldChange}
 *   onFieldBlur={handleFieldBlur}
 *   alertUnit="%"
 *   errors={{}}
 *   infrastructureMonitor={monitorConfig}
 * />
 */
export const CustomThreshold = ({
	checkboxId,
	checkboxName,
	checkboxLabel,
	onCheckboxChange,
	isChecked,
	fieldId,
	fieldName,
	fieldValue,
	onFieldChange,
	onFieldBlur,
	alertUnit,
	errors,
}) => {
	const theme = useTheme();
	return (
		<Stack
			direction={"row"}
			sx={{
				width: "50%",
				justifyContent: "space-between",
				flexWrap: "wrap",
			}}
		>
			<Box>
				<Checkbox
					id={checkboxId}
					name={checkboxName}
					label={checkboxLabel}
					isChecked={isChecked}
					onChange={onCheckboxChange}
				/>
			</Box>
			<Stack
				direction={"row"}
				sx={{
					justifyContent: "flex-end",
				}}
			>
				<TextInput
					maxWidth="var(--env-var-width-4)"
					type="number"
					id={fieldId}
					name={fieldName}
					value={fieldValue}
					onBlur={onFieldBlur}
					onChange={onFieldChange}
					error={errors[fieldId] ? true : false}
					disabled={!isChecked}
				/>

				<Typography
					component="p"
					m={theme.spacing(3)}
				>
					{alertUnit}
				</Typography>
			</Stack>
		</Stack>
	);
};

CustomThreshold.propTypes = {
	checkboxId: PropTypes.string,
	checkboxName: PropTypes.string,
	checkboxLabel: PropTypes.string.isRequired,
	isChecked: PropTypes.bool.isRequired,
	onCheckboxChange: PropTypes.func.isRequired,
	fieldId: PropTypes.string.isRequired,
	fieldName: PropTypes.string,
	fieldValue: PropTypes.string.isRequired,
	onFieldChange: PropTypes.func.isRequired,
	onFieldBlur: PropTypes.func,
	alertUnit: PropTypes.string.isRequired,
	infrastructureMonitor: PropTypes.object.isRequired,
	errors: PropTypes.object.isRequired,
};
