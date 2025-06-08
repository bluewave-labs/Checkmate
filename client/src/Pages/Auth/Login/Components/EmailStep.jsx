import { useRef, useEffect } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import TextInput from "../../../../Components/Inputs/TextInput";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

/**
 * Renders the email step of the login process which includes an email field.
 *
 * @param {Object} props
 * @param {Object} props.form - Form state object.
 * @param {Object} props.errors - Object containing form validation errors.
 * @param {Function} props.onSubmit - Callback function to handle form submission.
 * @param {Function} props.onChange - Callback function to handle form input changes.
 * @param {Function} props.onBack - Callback function to handle "Back" button click.
 * @returns {JSX.Element}
 */
const EmailStep = ({ form, errors, onSubmit, onChange }) => {
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
			<Stack
				gap={{ xs: theme.spacing(12), sm: theme.spacing(16) }}
				textAlign="center"
				position="relative"
			>
				<Box>
					<Typography component="h1">{t("auth.login.heading")}</Typography>
					<Typography>{t("auth.login.subheadings.stepOne")}</Typography>
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
					<TextInput
						type="email"
						id="login-email-input"
						label={t("auth.common.inputs.email.label")}
						isRequired={true}
						placeholder={t("auth.common.inputs.email.placeholder")}
						autoComplete="email"
						value={form.email}
						onChange={onChange}
						error={errors.email ? true : false}
						helperText={errors.email ? t(errors.email) : ""} // Localization keys are in validation.js
						ref={inputRef}
					/>
					<Stack
						direction="row"
						justifyContent="flex-end"
					>
						<Button
							variant="contained"
							color="accent"
							type="submit"
							disabled={errors.email && true}
							className="dashboard-style-button"
							sx={{
								width: "30%",
								px: theme.spacing(6),
								borderRadius: `${theme.shape.borderRadius}px !important`,
								"&.MuiButtonBase-root": {
									borderRadius: `${theme.shape.borderRadius}px !important`,
								},
								"&.MuiButton-root": {
									borderRadius: `${theme.shape.borderRadius}px !important`,
								},
								"&.Mui-focusVisible": {
									outline: `2px solid ${theme.palette.primary.main}`,
									outlineOffset: `2px`,
									boxShadow: `none`,
								},
							}}
						>
							{t("auth.common.navigation.continue")}
						</Button>
					</Stack>
				</Box>
			</Stack>
		</>
	);
};

EmailStep.propTypes = {
	form: PropTypes.object.isRequired,
	errors: PropTypes.object.isRequired,
	onSubmit: PropTypes.func.isRequired,
	onChange: PropTypes.func.isRequired,
};

export default EmailStep;
