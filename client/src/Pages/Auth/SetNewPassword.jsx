import { useId } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useTheme } from "@emotion/react";
import { Box, Stack, Typography, Button } from "@mui/material";
import { setNewPassword } from "../../Features/Auth/authSlice";
import { createToast } from "../../Utils/toastUtils";
import { newOrChangedCredentials } from "../../Validation/validation";
import Check from "../../Components/Check/Check";
import TextInput from "../../Components/Inputs/TextInput";
import { PasswordEndAdornment } from "../../Components/Inputs/TextInput/Adornments";
import IconBox from "../../Components/IconBox";
import LockIcon from "../../assets/icons/lock.svg?react";
import Logo from "../../assets/icons/checkmate-icon.svg?react";
import Background from "../../assets/Images/background-grid.svg?react";
import "./index.css";
import { useValidatePassword } from "./hooks/useValidatePassword";
import { Trans, useTranslation } from "react-i18next";

const SetNewPassword = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const theme = useTheme();
	const { t } = useTranslation();

	const passwordId = useId();
	const confirmPasswordId = useId();

	const { form, errors, handleChange, feedbacks } = useValidatePassword();

	const { isLoading } = useSelector((state) => state.auth);
	const { token } = useParams();

	const handleSubmit = async (e) => {
		e.preventDefault();
		const { error } = newOrChangedCredentials.validate(form, {
			abortEarly: false,
			context: { password: form.password },
		});

		if (error) {
			createToast({
				body:
					error.details && error.details.length > 0
						? error.details[0].message // FIXME: Potential untranslated string
						: t("auth.common.errors.validation"),
			});
		} else {
			const action = await dispatch(setNewPassword({ token, form }));
			if (action.payload.success) {
				navigate("/new-password-confirmed");
				createToast({
					body: t("auth.forgotPassword.toasts.success"),
				});
			} else {
				const errorMessage = action.payload
					? action.payload.msg // FIXME: Potential untranslated string
					: t("auth.forgotPassword.toasts.error");
				createToast({
					body: errorMessage,
				});
			}
		}
	};

	return (
		<Stack
			className="set-new-password-page auth"
			overflow="hidden"
			sx={{
				"& h1": {
					color: theme.palette.primary.main,
					fontWeight: 600,
					fontSize: 24,
				},
				"& p": {
					/* TODO font size from theme */
					fontSize: 14,
					color: theme.palette.primary.contrastTextSecondary,
				},
			}}
		>
			<Box
				className="background-pattern-svg"
				sx={{
					"& svg g g:last-of-type path": {
						stroke: theme.palette.primary.lowContrast,
					},
				}}
			>
				<Background style={{ width: "100%" }} />
			</Box>
			<Stack
				direction="row"
				alignItems="center"
				px={theme.spacing(12)}
				gap={theme.spacing(4)}
			>
				<Logo style={{ borderRadius: theme.shape.borderRadius }} />
				<Typography sx={{ userSelect: "none" }}>{t("common.appName")}</Typography>
			</Stack>
			<Stack
				width="100%"
				maxWidth={600}
				flex={1}
				justifyContent="center"
				px={{ xs: theme.spacing(12), lg: theme.spacing(20) }}
				pb={theme.spacing(12)}
				mx="auto"
				sx={{
					"& > .MuiStack-root": {
						border: 1,
						borderRadius: theme.spacing(5),
						borderColor: theme.palette.primary.lowContrast,
						backgroundColor: theme.palette.primary.main,
						padding: {
							xs: theme.spacing(12),
							sm: theme.spacing(20),
						},
					},
				}}
			>
				<Stack
					gap={{ xs: theme.spacing(8), sm: theme.spacing(12) }}
					alignItems="center"
					textAlign="center"
				>
					<Box>
						<Stack
							direction="row"
							justifyContent="center"
						>
							<IconBox
								height={48}
								width={48}
								minWidth={48}
								borderRadius={12}
								svgWidth={24}
								svgHeight={24}
								mb={theme.spacing(4)}
							>
								<LockIcon alt={t("auth.forgotPassword.imageAlts.lock")} />
							</IconBox>
						</Stack>
						<Typography component="h1">{t("auth.forgotPassword.heading")}</Typography>
						<Typography>{t("auth.forgotPassword.subheadings.stepThree")}</Typography>
					</Box>
					<Box
						width="100%"
						textAlign="left"
						sx={{
							"& .input-error": {
								display: "none",
							},
						}}
					>
						<Box
							component="form"
							noValidate
							spellCheck={false}
							onSubmit={handleSubmit}
						>
							<TextInput
								id={passwordId}
								type="password"
								name="password"
								label={t("auth.common.inputs.password.label")}
								isRequired={true}
								placeholder="••••••••"
								value={form.password}
								onChange={handleChange}
								error={errors.password ? true : false}
								helperText={
									errors.password === "auth.common.inputs.password.errors.empty"
										? t(errors.password)
										: ""
								} // Other errors are related to required password conditions and are visualized below the input
								endAdornment={<PasswordEndAdornment />}
							/>
						</Box>
						<Box
							component="form"
							noValidate
							spellCheck={false}
							onSubmit={handleSubmit}
						>
							<TextInput
								id={confirmPasswordId}
								type="password"
								name="confirm"
								label={t("auth.common.inputs.passwordConfirm.label")}
								isRequired={true}
								placeholder={t("auth.common.inputs.passwordConfirm.placeholder")}
								value={form.confirm}
								onChange={handleChange}
								error={errors.confirm ? true : false}
								helperText={t(errors.confirm)} // Localization keys are in validation.js
								endAdornment={<PasswordEndAdornment />}
							/>
						</Box>
						<Stack
							gap={theme.spacing(4)}
							mb={theme.spacing(12)}
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
								noHighlightText={t(
									"auth.common.inputs.password.rules.uppercase.beginning"
								)}
								text={t("auth.common.inputs.password.rules.uppercase.highlighted")}
								variant={feedbacks.uppercase}
							/>
							<Check
								noHighlightText={t(
									"auth.common.inputs.password.rules.lowercase.beginning"
								)}
								text={t("auth.common.inputs.password.rules.lowercase.highlighted")}
								variant={feedbacks.lowercase}
							/>
							<Check
								noHighlightText={t("auth.common.inputs.password.rules.match.beginning")}
								text={t("auth.common.inputs.password.rules.match.highlighted")}
								variant={feedbacks.confirm}
							/>
						</Stack>
					</Box>
					<Button
						variant="contained"
						color="accent"
						loading={isLoading}
						onClick={handleSubmit}
						disabled={
							form.password.length === 0 ||
							form.confirm.length === 0 ||
							Object.keys(errors).length !== 0
						}
						sx={{ width: "100%", maxWidth: 400 }}
					>
						{t("auth.forgotPassword.buttons.resetPassword")}
					</Button>
				</Stack>
			</Stack>
			<Box
				textAlign="center"
				p={theme.spacing(12)}
			>
				<Typography display="inline-block">
					<Trans
						i18nKey="auth.forgotPassword.links.login"
						components={{
							a: (
								<Typography
									component="span"
									color={theme.palette.primary.main}
									ml={theme.spacing(2)}
									onClick={() => navigate("/login")}
									sx={{ userSelect: "none" }}
								/>
							),
						}}
					/>
				</Typography>
			</Box>
		</Stack>
	);
};

export default SetNewPassword;
