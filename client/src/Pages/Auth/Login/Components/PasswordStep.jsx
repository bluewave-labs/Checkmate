import { useRef, useEffect } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import { useSelector } from "react-redux";
import TextInput from "../../../../Components/Inputs/TextInput";
import { PasswordEndAdornment } from "../../../../Components/Inputs/TextInput/Adornments";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
/**
 * Renders the password step of the login process, including a password input field.
 *
 * @param {Object} props
 * @param {Object} props.form - Form state object.
 * @param {Object} props.errors - Object containing form validation errors.
 * @param {Function} props.onSubmit - Callback function to handle form submission.
 * @param {Function} props.onChange - Callback function to handle form input changes.
 * @param {Function} props.onBack - Callback function to handle "Back" button click.
 * @returns {JSX.Element}
 */
const PasswordStep = ({ form, errors, onSubmit, onChange, onBack }) => {
	const theme = useTheme();
	const inputRef = useRef(null);
	const authState = useSelector((state) => state.auth);
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
				position="relative"
				textAlign="center"
			>
				<Box>
					<Typography component="h1">{t("auth.login.heading")}</Typography>
					<Typography>{t("auth.login.subheadings.stepTwo")}</Typography>
				</Box>
				<Box
					component="form"
					noValidate
					spellCheck={false}
					onSubmit={onSubmit}
					textAlign="left"
					mb={theme.spacing(5)}
					sx={{
						display: "grid",
						gap: { xs: theme.spacing(12), sm: theme.spacing(16) },
					}}
				>
					<TextInput
						type="password"
						id="login-password-input"
						label={t("auth.common.inputs.password.label")}
						isRequired={true}
						placeholder="••••••••••"
						autoComplete="current-password"
						value={form.password}
						onChange={onChange}
						error={errors.password ? true : false}
						helperText={errors.password ? t(errors.password) : ""} // Localization keys are in validation.js
						ref={inputRef}
						endAdornment={<PasswordEndAdornment />}
					/>
					<Stack
						direction="row"
						justifyContent="space-between"
					>
						<Button
							variant="outlined"
							color="info"
							onClick={onBack}
							className="dashboard-style-button"
							sx={{
								px: theme.spacing(5),
								borderRadius: `${theme.shape.borderRadius}px !important`,
								"&.MuiButtonBase-root": {
									borderRadius: `${theme.shape.borderRadius}px !important`,
								},
								"&.MuiButton-root": {
									borderRadius: `${theme.shape.borderRadius}px !important`,
								},
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
							{t("auth.common.navigation.back")}{" "}
						</Button>
						<Button
							variant="contained"
							color="accent"
							type="submit"
							loading={authState.isLoading}
							disabled={errors.password && true}
							className="dashboard-style-button"
							sx={{
								width: "30%",
								px: theme.spacing(4),
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
								},
								boxShadow: `none`,
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

PasswordStep.propTypes = {
	form: PropTypes.object.isRequired,
	errors: PropTypes.object.isRequired,
	onSubmit: PropTypes.func.isRequired,
	onChange: PropTypes.func.isRequired,
	onBack: PropTypes.func.isRequired,
};

export default PasswordStep;
