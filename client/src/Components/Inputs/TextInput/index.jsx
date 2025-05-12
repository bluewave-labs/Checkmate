import { Stack, TextField, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import { forwardRef, useState, cloneElement } from "react";
import PropTypes from "prop-types";

const getSx = (theme, type, maxWidth) => {
	const sx = {
		maxWidth: maxWidth,

		"& .MuiFormHelperText-root": {
			position: "absolute",
			bottom: `-${theme.spacing(24)}`,
			minHeight: theme.spacing(24),
		},
	};

	if (type === "url") {
		return {
			...sx,
			"& .MuiInputBase-root": { padding: 0 },
			"& .MuiStack-root": {
				borderTopLeftRadius: theme.shape.borderRadius,
				borderBottomLeftRadius: theme.shape.borderRadius,
			},
		};
	}
	return sx;
};

const Required = () => {
	const theme = useTheme();
	return (
		<Typography
			component="span"
			ml={theme.spacing(1)}
			color={theme.palette.error.main}
		>
			*
		</Typography>
	);
};

const Optional = ({ optionalLabel }) => {
	const theme = useTheme();
	return (
		<Typography
			component="span"
			fontSize="inherit"
			fontWeight={400}
			ml={theme.spacing(2)}
			sx={{ opacity: 0.6 }}
		>
			{optionalLabel || "(optional)"}
		</Typography>
	);
};

Optional.propTypes = {
	optionalLabel: PropTypes.string,
};

const TextInput = forwardRef(
	(
		{
			id,
			name,
			type,
			value,
			placeholder,
			isRequired,
			isOptional,
			optionalLabel,
			onChange,
			onBlur,
			error = false,
			helperText = null,
			startAdornment = null,
			endAdornment = null,
			label = null,
			maxWidth = "100%",
			flex,
			marginTop,
			marginRight,
			marginBottom,
			marginLeft,
			disabled = false,
			hidden = false,
		},
		ref
	) => {
		const [fieldType, setFieldType] = useState(type);
		const theme = useTheme();
		return (
			<Stack
				flex={flex}
				display={hidden ? "none" : ""}
				marginTop={marginTop}
				marginRight={marginRight}
				marginBottom={marginBottom}
				marginLeft={marginLeft}
			>
				<Typography
					component="h3"
					fontSize={"var(--env-var-font-size-medium)"}
					color={theme.palette.primary.contrastTextSecondary}
					fontWeight={500}
					mb={theme.spacing(2)}
				>
					{label}
					{isRequired && <Required />}
					{isOptional && <Optional optionalLabel={optionalLabel} />}
				</Typography>
				<TextField
					id={id}
					name={name}
					type={fieldType}
					value={value}
					placeholder={placeholder}
					onChange={onChange}
					onBlur={onBlur}
					error={error}
					helperText={helperText}
					inputRef={ref}
					sx={getSx(theme, type, maxWidth)}
					slotProps={{
						input: {
							startAdornment: startAdornment,
							endAdornment: endAdornment
								? cloneElement(endAdornment, { fieldType, setFieldType })
								: null,
						},
					}}
					disabled={disabled}
				/>
			</Stack>
		);
	}
);

TextInput.displayName = "TextInput";

TextInput.propTypes = {
	type: PropTypes.string,
	id: PropTypes.string,
	name: PropTypes.string,
	value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	placeholder: PropTypes.string,
	isRequired: PropTypes.bool,
	isOptional: PropTypes.bool,
	optionalLabel: PropTypes.string,
	onChange: PropTypes.func,
	onBlur: PropTypes.func,
	error: PropTypes.bool,
	helperText: PropTypes.string,
	startAdornment: PropTypes.node,
	endAdornment: PropTypes.node,
	label: PropTypes.string,
	maxWidth: PropTypes.string,
	flex: PropTypes.number,
	marginTop: PropTypes.string,
	marginRight: PropTypes.string,
	marginBottom: PropTypes.string,
	marginLeft: PropTypes.string,
	disabled: PropTypes.bool,
	hidden: PropTypes.bool,
};

export default TextInput;
