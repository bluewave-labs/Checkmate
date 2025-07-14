import PropTypes from "prop-types";
import { FormControlLabel, Radio as MUIRadio, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import RadioChecked from "../../../assets/icons/radio-checked.svg?react";
import "./index.css";

/**
 * Radio component.
 *
 * @component
 * @example
 * // Usage:
 * <Radio
 *   title="Radio Button Title"
 *   desc="Radio Button Description"
 *   size="small"
 * />
 *
 * @param {Object} props - The component
 * @param {string} id - The id of the radio button.
 * @param {string} title - The title of the radio button.
 * @param {string} [desc] - The description of the radio button.
 * @param {string} [size="small"] - The size of the radio button.
 * @returns {JSX.Element} - The rendered Radio component.
 */

const Radio = ({
	name,
	checked,
	value,
	id,
	size,
	title,
	desc,
	onChange,
	labelSpacing,
}) => {
	const theme = useTheme();

	return (
		<FormControlLabel
			className="custom-radio-button"
			name={name}
			checked={checked}
			value={value}
			control={
				<MUIRadio
					id={id}
					size={size}
					checkedIcon={<RadioChecked />}
					sx={{
						color: "transparent",
						width: 16,
						height: 16,
						boxShadow: `inset 0 0 0 1px ${theme.palette.secondary.main}`,
						"&:not(.Mui-checked)": {
							boxShadow: `inset 0 0 0 1px ${theme.palette.primary.contrastText}70`, // Use theme text color for the outline
						},
						mt: theme.spacing(0.5),
					}}
				/>
			}
			onChange={onChange}
			label={
				<>
					<Typography
						component="p"
						mb={
							labelSpacing !== undefined ? theme.spacing(labelSpacing) : theme.spacing(2)
						}
					>
						{title}
					</Typography>
					<Typography
						component="h6"
						mt={theme.spacing(1)}
						color={theme.palette.primary.contrastTextSecondary}
					>
						{desc}
					</Typography>
				</>
			}
			labelPlacement="end"
			sx={{
				alignItems: "flex-start",
				p: theme.spacing(2.5),
				m: theme.spacing(-2.5),
				borderRadius: theme.shape.borderRadius,
				"&:hover": {
					backgroundColor: theme.palette.tertiary.main,
				},
				"& .MuiButtonBase-root": {
					p: 0,
					mr: theme.spacing(6),
				},
			}}
		/>
	);
};

Radio.propTypes = {
	title: PropTypes.string,
	desc: PropTypes.string,
	size: PropTypes.string,
	name: PropTypes.string,
	checked: PropTypes.bool,
	value: PropTypes.string,
	id: PropTypes.string,
	onChange: PropTypes.func,
};

export default Radio;
