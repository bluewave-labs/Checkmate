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
	onSubmit: PropTypes.func,
	onBack: PropTypes.func,
};

/**
 * Renders the third step of the sign up process.
 *
 * @param {Object} props
 * @param {Function} props.onSubmit - Callback function to handle form submission.
 * @param {Function} props.onBack - Callback function to handle "Back" button click.
 * @returns {JSX.Element}
 */
function StepThree({ onSubmit, onBack }) {
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
					<Typography component="h1">{t("signUp")}</Typography>
					<Typography>{t("createPassword")}</Typography>
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
							label={t("commonPassword")}
							isRequired={true}
							placeholder={t("createAPassword")}
							autoComplete="current-password"
							value={form.password}
							onChange={handleChange}
							error={errors.password && errors.password[0] ? true : false}
							ref={inputRef}
						/>
						<TextInput
							type="password"
							id="register-confirm-input"
							name="confirm"
							label={t("authSetNewPasswordConfirmPassword")}
							isRequired={true}
							placeholder={t("confirmPassword")}
							autoComplete="current-password"
							value={form.confirm}
							onChange={handleChange}
							error={errors.confirm && errors.confirm[0] ? true : false}
						/>
					</Box>
					<Stack
						gap={theme.spacing(4)}
						mb={{ xs: theme.spacing(6), sm: theme.spacing(8) }}
					>
						<Check
							noHighlightText={t("authPasswordMustBeAtLeast")}
							text={t("authPasswordCharactersLong")}
							variant={feedbacks.length}
						/>
						<Check
							noHighlightText={t("authPasswordMustContainAtLeast")}
							text={t("authPasswordSpecialCharacter")}
							variant={feedbacks.special}
						/>
						<Check
							noHighlightText={t("authPasswordMustContainAtLeast")}
							text={t("authPasswordOneNumber")}
							variant={feedbacks.number}
						/>
						<Check
							noHighlightText={t("authPasswordMustContainAtLeast")}
							text={t("authPasswordUpperCharacter")}
							variant={feedbacks.uppercase}
						/>
						<Check
							noHighlightText={t("authPasswordMustContainAtLeast")}
							text={t("authPasswordLowerCharacter")}
							variant={feedbacks.lowercase}
						/>
						<Check
							noHighlightText={t("authPasswordConfirmAndPassword")}
							text={t("authPasswordMustMatch")}
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
							{t("commonBack")}
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
							{t("continue")}
						</Button>
					</Stack>
				</Box>
			</Stack>
		</>
	);
}

export { StepThree };
