import PropTypes from "prop-types";
import {
	Box,
	ListItem,
	Autocomplete,
	TextField,
	Stack,
	Typography,
	Checkbox,
} from "@mui/material";
import { useTheme } from "@emotion/react";
import SearchIcon from "../../../assets/icons/search.svg?react";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

/**
 * Search component using Material UI's Autocomplete.
 *
 * @param {Object} props
 * @param {string} props.id - Unique identifier for the Autocomplete component
 * @param {Array<Object>} props.options - Options to display in the Autocomplete dropdown
 * @param {string} props.filteredBy - Key to access the option label from the options
 * @param {string} props.value - Current input value for the Autocomplete
 * @param {Function} props.handleChange - Function to call when the input changes
 * @param {Function} Prop.onBlur - Function to call when the input is blured
 * @param {Object} props.sx - Additional styles to apply to the component
 * @returns {JSX.Element} The rendered Search component
 */

const SearchAdornment = () => {
	const theme = useTheme();
	return (
		<Box
			mr={theme.spacing(4)}
			height={16}
			sx={{
				"& svg": {
					width: 16,
					height: 16,
					"& path": {
						stroke: theme.palette.primary.contrastTextTertiary,
						strokeWidth: 1.2,
					},
				},
			}}
		>
			<SearchIcon />
		</Box>
	);
};

//TODO keep search state inside of component
const Search = ({
	label,
	id,
	options,
	filteredBy,
	secondaryLabel,
	value,
	inputValue,
	handleInputChange,
	handleChange,
	sx,
	multiple = false,
	isAdorned = true,
	error,
	disabled,
	startAdornment,
	endAdornment,
	onBlur,
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [selectAll, setSelectAll] = React.useState(false);

	const [open, setOpen] = React.useState(false);
	const enhancedOptions = React.useMemo(() => {
		return multiple && isAdorned
			? [
					{ [filteredBy]: t("selectAll"), isSelectAll: true, _id: "select_all" },
					...options,
				]
			: options;
	}, [multiple, isAdorned, options, filteredBy]);
	const isOptionSelected = (option) => {
		if (!multiple && !isAdorned) return false;
		if (Array.isArray(value)) {
			return value.some((item) => item._id === option._id);
		}
		return false;
	};
	const handleSelectAll = (isSelectAll) => {
		const newValue = isSelectAll ? [...options] : [];
		handleChange(newValue);
		setSelectAll(isSelectAll);
	};
	useEffect(() => {
		const allSelected =
			Array.isArray(value) && Array.isArray(options) && value.length === options.length;
		if (selectAll !== allSelected) setSelectAll(allSelected);
	}, [value, options]);
	return (
		<Autocomplete
			onBlur={onBlur}
			multiple={multiple}
			id={id}
			value={value}
			open={open}
			onOpen={() => setOpen(true)}
			onClose={(event, reason) => {
				if (reason === "blur" || reason === "escape") {
					setOpen(false);
				}
			}}
			inputValue={inputValue}
			onInputChange={(_, newValue) => {
				handleInputChange(newValue);
			}}
			onChange={(_, newValue) => {
				if (multiple && isAdorned) {
					const hasSelectAllSelected =
						Array.isArray(newValue) && newValue.some((item) => item.isSelectAll);
					if (hasSelectAllSelected) {
						handleSelectAll(!selectAll);
					} else {
						handleChange(newValue);
						setSelectAll(Array.isArray(newValue) && newValue.length === options.length);
					}
				} else {
					handleChange(newValue);
					setOpen(false);
				}
			}}
			fullWidth
			freeSolo
			disabled={disabled}
			disableClearable
			options={enhancedOptions}
			getOptionLabel={(option) => option[filteredBy]}
			isOptionEqualToValue={(option, value) => option._id === value._id} // Compare by unique identifier
			renderInput={(params) => (
				<Stack>
					<Typography
						component="h3"
						fontSize={"var(--env-var-font-size-medium)"}
						color={theme.palette.primary.contrastTextSecondary}
						fontWeight={500}
					>
						{label}
					</Typography>
					<TextField
						{...params}
						error={Boolean(error)}
						placeholder="Type to search"
						slotProps={{
							input: {
								...params.InputProps,
								...(isAdorned && { startAdornment: <SearchAdornment /> }),
								...(startAdornment && { startAdornment: startAdornment }),
								...(endAdornment && { endAdornment: endAdornment }),
							},
						}}
						sx={{}}
					/>
					{error && (
						<Typography
							component="span"
							className="input-error"
							color={theme.palette.error.main}
							mt={theme.spacing(2)}
							sx={{
								opacity: 0.8,
							}}
						>
							{error}
						</Typography>
					)}
				</Stack>
			)}
			filterOptions={(options, { inputValue }) => {
				if (inputValue.trim() === "" && multiple && isAdorned) {
					return enhancedOptions;
				}
				const filtered = options.filter((option) =>
					option[filteredBy].toLowerCase().includes(inputValue.toLowerCase())
				);

				if (filtered.length === 0) {
					return [{ [filteredBy]: "No monitors found", noOptions: true }];
				}
				return filtered;
			}}
			getOptionKey={(option) => {
				return option._id;
			}}
			renderOption={(props, option) => {
				const { key, ...optionProps } = props;
				const hasSecondaryLabel = secondaryLabel && option[secondaryLabel] !== undefined;
				const port = option["port"];
				const selected = isOptionSelected(option);
				return (
					<ListItem
						key={key}
						{...optionProps}
						sx={
							option.noOptions
								? {
										pointerEvents: "none",
										backgroundColor: theme.palette.primary.main,
									}
								: option.isSelectAll
									? {
											fontWeight: "bold",
											backgroundColor: theme.palette.primary.light,
											"&:hover": {
												backgroundColor: theme.palette.primary.light,
											},
										}
									: {}
						}
					>
						{multiple && isAdorned && !option.noOptions && (
							<Checkbox
								checked={option.isSelectAll ? selectAll : selected}
								sx={{
									color: theme.palette.primary.contrastTextSecondary,
									"&.Mui-checked": {
										color: theme.palette.secondary.main,
									},
									padding: 0,
								}}
							/>
						)}
						{option[filteredBy] +
							(hasSecondaryLabel
								? ` (${option[secondaryLabel]}${port ? `: ${port}` : ""})`
								: "")}
					</ListItem>
				);
			}}
			slotProps={{
				popper: {
					keepMounted: true,
					sx: {
						"& ul": { p: 2, backgroundColor: theme.palette.primary.main },
						"& li.MuiAutocomplete-option": {
							color: theme.palette.primary.contrastTextSecondary,
							px: 4,
							borderRadius: theme.shape.borderRadius,
						},

						"& .MuiAutocomplete-listbox .MuiAutocomplete-option[aria-selected='true'], & .MuiAutocomplete-listbox .MuiAutocomplete-option[aria-selected='true'].Mui-focused, & .MuiAutocomplete-listbox .MuiAutocomplete-option[aria-selected='true']:hover":
							{
								backgroundColor: theme.palette.primary.lowContrast,
								color: "red",
							},
						"& li.MuiAutocomplete-option:hover:not([aria-selected='true'])": {
							color: theme.palette.secondary.contrastText,
							backgroundColor: theme.palette.secondary.main,
						},
						"& .MuiAutocomplete-noOptions": {
							px: theme.spacing(6),
							py: theme.spacing(5),
						},
					},
				},
			}}
			sx={{
				/* 	height: 34,*/
				"&.MuiAutocomplete-root .MuiAutocomplete-input": { p: 0 },
				...sx,
			}}
		/>
	);
};

Search.propTypes = {
	label: PropTypes.string,
	id: PropTypes.string,
	multiple: PropTypes.bool,
	options: PropTypes.array.isRequired,
	filteredBy: PropTypes.string.isRequired,
	secondaryLabel: PropTypes.string,
	value: PropTypes.array,
	inputValue: PropTypes.string.isRequired,
	handleInputChange: PropTypes.func.isRequired,
	handleChange: PropTypes.func,
	isAdorned: PropTypes.bool,
	sx: PropTypes.object,
	error: PropTypes.string,
	disabled: PropTypes.bool,
	startAdornment: PropTypes.object,
	endAdornment: PropTypes.object,
	onBlur: PropTypes.func,
};

export default Search;
