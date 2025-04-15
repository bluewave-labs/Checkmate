import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import { Box, Button, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import TextInput from "../../../../Components/Inputs/TextInput";
import { useTranslation } from "react-i18next";

StepOne.propTypes = {
	form: PropTypes.object,
	errors: PropTypes.object,
	onSubmit: PropTypes.func,
	onChange: PropTypes.func,
	onBack: PropTypes.func,
};

/**
 * Renders the first step of the sign up process.
 *
 * @param {Object} props
 * @param {Object} props.form - Form state object.
 * @param {Object} props.errors - Object containing form validation errors.
 * @param {Function} props.onSubmit - Callback function to handle form submission.
 * @param {Function} props.onChange - Callback function to handle form input changes.
 * @param {Function} props.onBack - Callback function to handle "Back" button click.
 * @returns {JSX.Element}
 */

function StepOne({ form, errors, onSubmit, onChange, onBack }) {
	const theme = useTheme();
	const inputRef = useRef(null);
	const { t } = useTranslation();

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

	return (
		<>
			{/* TODO this stack should be a component */}
			<Stack
				gap={{ xs: theme.spacing(12), sm: theme.spacing(16) }}
				textAlign="center"
			>
				<Box>
					<Typography component="h1">{t("signUp")}</Typography>
					<Typography>{t("authRegisterStepOnePersonalDetails")}</Typography>
				</Box>

				<Box
					textAlign="left"
					component="form"
					noValidate
					spellCheck={false}
					onSubmit={onSubmit}
					display="grid"
					gap={{ xs: theme.spacing(12), sm: theme.spacing(16) }}
				>
					<Box
						display="grid"
						gap={{ xs: theme.spacing(8), sm: theme.spacing(12) }}
					>
						<TextInput
							id="register-firstname-input"
							label="Name"
							isRequired={true}
							placeholder="Jordan"
							autoComplete="given-name"
							value={form.firstName}
							onChange={onChange}
							error={errors.firstName ? true : false}
							helperText={errors.firstName}
							ref={inputRef}
						/>
						<TextInput
							id="register-lastname-input"
							label="Surname"
							isRequired={true}
							placeholder="Ellis"
							autoComplete="family-name"
							value={form.lastName}
							onChange={onChange}
							error={errors.lastName ? true : false}
							helperText={errors.lastName}
						/>
					</Box>
					<Stack
						direction="row"
						justifyContent="space-between"
					>
						{/* TODO buttons should be  a component should be a component */}
						<Button
							variant="outlined"
							color="info"
							onClick={onBack}
							sx={{
								px: theme.spacing(5),
								"& svg.MuiSvgIcon-root": {
									mr: theme.spacing(3),
								},

								"&:focus-visible": {
									outline: `2px solid ${theme.palette.primary.main}`,
									outlineOffset: `2px`,
								},
							}}
						>
							<ArrowBackRoundedIcon />
							{t("commonBack")}
						</Button>
						<Button
							variant="contained"
							color="accent"
							type="submit"
							disabled={(errors.firstName || errors.lastName) && true}
							sx={{
								width: "30%",
								"&.Mui-focusVisible": {
									outline: `2px solid ${theme.palette.primary.main}`,
									outlineOffset: `2px`,
									boxShadow: `none`,
								},
							}}
						>
							{t("continue")}
						</Button>
					</Stack>
				</Box>
			</Stack>
		</>
	);
}

export { StepOne };
