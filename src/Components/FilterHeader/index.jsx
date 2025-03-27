import {
	Checkbox,
	FormControl,
	InputLabel,
	ListItemText,
	MenuItem,
	Select,
} from "@mui/material";
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

const FilterHeader = ({ header, options, value, onChange, multiple = true }) => {
	const theme = useTheme();

	const selectStyles = {
		"& .MuiOutlinedInput-input": {
			color: theme.palette.primary.contrastText,
		},
		"& .MuiOutlinedInput-notchedOutline": {
			borderColor: theme.palette.primary.lowContrast,
			borderRadius: theme.shape.borderRadius,
		},
		"& .MuiSelect-icon": {
			color: theme.palette.primary.contrastText,
		},
		"&:hover": {
			backgroundColor: theme.palette.primary.main,
		},
		"&:hover .MuiOutlinedInput-notchedOutline": {
			borderColor: theme.palette.primary.lowContrast,
		},
	};

	const menuItemStyles = {
		"&:hover": {
			backgroundColor: theme.palette.secondary.main,
		},
	};

	return (
		<div>
			<FormControl
				sx={{ m: theme.spacing(2), minWidth: 120 }}
				size="small"
			>
				<InputLabel
					sx={{
						color: theme.palette.primary.contrastText,
						"&.Mui-focused": {
							display: "none",
						},
					}}
				>
					{header}
				</InputLabel>
				<Select
					multiple={multiple}
					IconComponent={(props) => (
						<AddCircleOutlineIcon
							{...props}
							sx={{ fontSize: "medium" }}
						/>
					)}
					value={value}
					onChange={onChange}
					renderValue={(selected) => selected.join(", ")}
					sx={selectStyles}
				>
					{options.map((option) => (
						<MenuItem
							key={option}
							value={option}
							sx={menuItemStyles}
						>
							<Checkbox
								checked={value.includes(option)}
								size="small"
							/>
							<ListItemText
								primary={
									option === "http"
										? "HTTP(S)"
										: option === "ping"
											? "Ping"
											: option === "docker"
												? "Docker"
												: option === "port"
													? "Port"
													: option
								}
							/>
						</MenuItem>
					))}
				</Select>
			</FormControl>
		</div>
	);
};

FilterHeader.propTypes = {
	header: PropTypes.string,
	options: PropTypes.arrayOf(PropTypes.string),
	value: PropTypes.arrayOf(PropTypes.string),
	onChange: PropTypes.func,
	multiple: PropTypes.bool,
};

export default FilterHeader;
