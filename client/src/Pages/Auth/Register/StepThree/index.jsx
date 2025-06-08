import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import { Box, Button, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import TextInput from "../../../../Components/Inputs/TextInput";
import Check from "../../../../Components/Check/Check";
import { useValidatePassword } from "../../hooks/useValidatePassword";
import { useTranslation } from "react-i18next";
StepThree.propTypes = {
	isSuperAdmin: PropTypes.bool,
	onSubmit: PropTypes.func,
	onBack: PropTypes.func,
};

/**
 * Renders the third step of the sign up process.
 *
 * @param {Object} props
 * @param {boolean} props.isSuperAdmin - Whether the user is creating and admin account
 * @param {Function} props.onSubmit - Callback function to handle form submission.
 * @param {Function} props.onBack - Callback function to handle "Back" button click.
 * @returns {JSX.Element}
 */
function StepThree({ isSuperAdmin, onSubmit, onBack }) {
	const theme = useTheme();
	const inputRef = useRef(null);
	const { t } = useTranslation();

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

	const { handleChange, feedbacks, form, errors } = useValidatePassword();
	return (
		<>
			<Stack
				gap={{ xs: theme.spacing(8), sm: theme.spacing(12) }}
				textAlign="center"
			>
				<Box>
					<Typography component="h1">
						{isSuperAdmin
							? t("auth.registration.heading.superAdmin")
							: t("auth.registration.heading.user")}
					</Typography>
					<Typography>{t("auth.registration.subheadings.stepThree")}</Typography>
				</Box>
				<Box
					component="form"
					noValidate
					spellCheck={false}
					onSubmit={onSubmit}
					textAlign="left"
					display="grid"
					gap={{ xs: theme.spacing(12), sm: theme.spacing(16) }}
					sx={{
						"& .input-error": {
							display: "none",
						},
					}}
				>
					<Box
						display="grid"
						gap={{ xs: theme.spacing(8), sm: theme.spacing(12) }}
					>
						<TextInput
							type="password"
							id="register-password-input"
							name="password"
							label={t("auth.common.inputs.password.label")}
							isRequired={true}
							placeholder="••••••••••"
							autoComplete="current-password"
							value={form.password}
							onChange={handleChange}
							error={errors.password && errors.password[0] ? true : false}
							helperText={
								errors.password === "auth.common.inputs.password.errors.empty"
									? t(errors.password)
									: ""
							} // Other errors are related to required password conditions and are visualized below the input
							ref={inputRef}
						/>
						<TextInput
							type="password"
							id="register-confirm-input"
							name="confirm"
							label={t("auth.common.inputs.passwordConfirm.label")}
							isRequired={true}
							placeholder={t("auth.common.inputs.passwordConfirm.placeholder")}
							autoComplete="current-password"
							value={form.confirm}
							onChange={handleChange}
							error={errors.confirm && errors.confirm[0] ? true : false}
							helperText={t(errors.confirm)} // Localization keys are in validation.js
						/>
					</Box>
					<Stack
						gap={theme.spacing(4)}
						mb={{ xs: theme.spacing(6), sm: theme.spacing(8) }}
					>
						<Check
							noHighlightText={t("auth.common.inputs.password.rules.length.beginning")}
							text={t("auth.common.inputs.password.rules.length.highlighted")}
							variant={feedbacks.length}
						/>
						<Check
							noHighlightText={t("auth.common.inputs.password.rules.special.beginning")}
							text={t("auth.common.inputs.password.rules.special.highlighted")}
							variant={feedbacks.special}
						/>
						<Check
							noHighlightText={t("auth.common.inputs.password.rules.number.beginning")}
							text={t("auth.common.inputs.password.rules.number.highlighted")}
							variant={feedbacks.number}
						/>
						<Check
							noHighlightText={t("auth.common.inputs.password.rules.uppercase.beginning")}
							text={t("auth.common.inputs.password.rules.uppercase.highlighted")}
							variant={feedbacks.uppercase}
						/>
						<Check
							noHighlightText={t("auth.common.inputs.password.rules.lowercase.beginning")}
							text={t("auth.common.inputs.password.rules.lowercase.highlighted")}
							variant={feedbacks.lowercase}
						/>
						<Check
							noHighlightText={t("auth.common.inputs.password.rules.match.beginning")}
							text={t("auth.common.inputs.password.rules.match.highlighted")}
							variant={feedbacks.confirm}
						/>
					</Stack>
					<Stack
						direction="row"
						justifyContent="space-between"
					>
						<Button
							variant="outlined"
							color="info"
							onClick={onBack}
							sx={{
								px: theme.spacing(5),
								"& svg.MuiSvgIcon-root": {
									mr: theme.spacing(3),
								},
								":focus-visible": {
									outline: `2px solid ${theme.palette.primary.lowContrast}`,
									outlineOffset: "4px",
								},
							}}
						>
							<ArrowBackRoundedIcon />
							{t("auth.common.navigation.back")}
						</Button>
						<Button
							type="submit"
							variant="contained"
							color="accent"
							disabled={
								form.password.length === 0 ||
								form.confirm.length === 0 ||
								Object.keys(errors).length !== 0
							}
							sx={{
								width: "30%",
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
}

export { StepThree };
