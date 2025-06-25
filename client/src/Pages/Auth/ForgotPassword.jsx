import { Box, Stack, Typography, Button } from "@mui/material";
import { useTheme } from "@emotion/react";
import { createToast } from "../../Utils/toastUtils";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword } from "../../Features/Auth/authSlice";
import { useEffect, useState } from "react";
import { newOrChangedCredentials } from "../../Validation/validation";
import { useNavigate } from "react-router-dom";
import TextInput from "../../Components/Inputs/TextInput";
import Logo from "../../assets/icons/checkmate-icon.svg?react";
import Key from "../../assets/icons/key.svg?react";
import Background from "../../assets/Images/background-grid.svg?react";
import IconBox from "../../Components/IconBox";
import { Trans, useTranslation } from "react-i18next";
import "./index.css";

const ForgotPassword = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const theme = useTheme();

	const { isLoading } = useSelector((state) => state.auth);
	const [errors, setErrors] = useState({});
	const [form, setForm] = useState({
		email: "",
	});

	useEffect(() => {
		const email = sessionStorage.getItem("email");
		email && setForm({ email: sessionStorage.getItem("email") });
	}, []);

	const { t } = useTranslation();

	const handleSubmit = async (event) => {
		event.preventDefault();

		const { error } = newOrChangedCredentials.validate(form, { abortEarly: false });

		if (error) {
			// validation errors
			const err =
				error.details && error.details.length > 0
					? error.details[0].message // FIXME: Possibly untranslated string
					: t("auth.common.errors.validation");
			setErrors({ email: err });
			createToast({
				body: err,
			});
		} else {
			const action = await dispatch(forgotPassword(form));
			if (action.payload.success) {
				sessionStorage.setItem("email", form.email);
				navigate("/check-email");
				createToast({
					body: t("auth.forgotPassword.toasts.sent").replace("<email/>", form.email),
				});
			} else {
				if (action.payload) {
					// dispatch errors
					createToast({
						body: action.payload.msg, // FIXME: Potentially untranslated string
					});
				} else {
					// unknown errors
					createToast({
						body: t("common.toasts.unknownError"),
					});
				}
			}
		}
	};

	const handleChange = (event) => {
		const { value } = event.target;
		setForm({ email: value });

		const { error } = newOrChangedCredentials.validate(
			{ email: value },
			{ abortEarly: false }
		);

		if (error) setErrors({ email: error.details[0].message });
		else delete errors.email;
	};

	const handleNavigate = () => {
		sessionStorage.removeItem("email");
		navigate("/login");
	};

	return (
		<Stack
			className="forgot-password-page auth"
			overflow="hidden"
			sx={{
				"& h1": {
					color: theme.palette.primary.main,
					fontWeight: 600,
					fontSize: 21,
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
				pb={theme.spacing(20)}
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
								<Key alt={t("auth.forgotPassword.imageAlts.passwordKey")} />
							</IconBox>
						</Stack>
						<Typography component="h1">{t("auth.forgotPassword.heading")}</Typography>
						<Typography>{t("auth.forgotPassword.subheadings.stepOne")}</Typography>
					</Box>
					<Box
						component="form"
						width="95%"
						textAlign="left"
						noValidate
						spellCheck={false}
						onSubmit={handleSubmit}
					>
						<TextInput
							type="email"
							id="forgot-password-email-input"
							label={t("auth.common.inputs.email.label")}
							isRequired={true}
							placeholder={t("auth.common.inputs.email.placeholder")}
							value={form.email}
							onChange={handleChange}
							error={errors.email ? true : false}
							helperText={t(errors.email)} // Localization keys are in validation.js
						/>
						<Button
							variant="contained"
							color="accent"
							loading={isLoading}
							disabled={errors.email !== undefined}
							onClick={handleSubmit}
							sx={{
								width: "100%",
								mt: theme.spacing(15),
							}}
						>
							{t("auth.common.navigation.continue")}
						</Button>
					</Box>
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
									color={theme.palette.accent.main}
									ml={theme.spacing(2)}
									onClick={handleNavigate}
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

export default ForgotPassword;
