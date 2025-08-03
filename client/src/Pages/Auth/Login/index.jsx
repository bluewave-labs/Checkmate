// Components
import Stack from "@mui/material/Stack";
import AuthHeader from "../components/AuthHeader";
import Button from "@mui/material/Button";
import TextInput from "../../../Components/Inputs/TextInput";
import { PasswordEndAdornment } from "../../../Components/Inputs/TextInput/Adornments";
import { loginCredentials } from "../../../Validation/validation";
import TextLink from "../../../Components/TextLink";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Logo from "../../../assets/icons/checkmate-icon.svg?react";
import Background from "../../../assets/Images/background-grid.svg?react";
// Utils
import { login } from "../../../Features/Auth/authSlice";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { createToast } from "../../../Utils/toastUtils";

const Login = () => {
	// Local state
	const [form, setForm] = useState({
		email: "",
		password: "",
	});
	const [errors, setErrors] = useState({
		email: "",
		password: "",
	});

	// Hooks
	const { t } = useTranslation();
	const theme = useTheme();
	const dispatch = useDispatch();
	const navigate = useNavigate();

	// Handlers
	const onChange = (e) => {
		let { name, value } = e.target;
		if (name === "email") {
			value = value.toLowerCase();
		}
		const updatedForm = { ...form, [name]: value };
		const { error } = loginCredentials.validate({ [name]: value });
		setForm(updatedForm);
		setErrors((prev) => ({
			...prev,
			[name]: error?.details?.[0]?.message || "",
		}));
	};

	const onSubmit = async (e) => {
		e.preventDefault();
		const toSubmit = { ...form };
		const { error } = loginCredentials.validate(toSubmit, { abortEarly: false });

		if (error) {
			const formErrors = {};
			for (const err of error.details) {
				formErrors[err.path[0]] = err.message;
			}
			setErrors(formErrors);
			return;
		}

		const action = await dispatch(login(form));
		if (action.payload.success) {
			navigate("/uptime");
			createToast({
				body: t("auth.login.toasts.success"),
			});
		} else {
			if (action.payload) {
				if (action.payload.msg === "Incorrect password")
					setErrors({
						password: t("auth.login.errors.password.incorrect"),
					});
				// dispatch errors
				createToast({
					body: t("auth.login.toasts.incorrectPassword"),
				});
			} else {
				// unknown errors
				createToast({
					body: t("common.toasts.unknownError"),
				});
			}
		}
	};

	return (
		<Stack
			gap={theme.spacing(10)}
			minHeight="100vh"
			position="relative"
			backgroundColor={theme.palette.primary.main}
			sx={{ overflow: "hidden" }}
		>
			<Box
				sx={{
					position: "absolute",
					top: 0,
					left: "0%",
					transform: "translate(-40%, -40%)",
					zIndex: 0,
					width: "100%",
					height: "100%",
					"& svg g g:last-of-type path": {
						stroke: theme.palette.primary.lowContrast,
					},
				}}
			>
				<Background style={{ width: "100%" }} />
			</Box>
			<Box
				sx={{
					position: "absolute",
					bottom: 0,
					right: 0,
					transform: "translate(45%, 55%)",
					zIndex: 0,
					width: "100%",
					height: "100%",
					"& svg g g:last-of-type path": {
						stroke: theme.palette.primary.lowContrast,
					},
				}}
			>
				<Background style={{ width: "100%" }} />
			</Box>
			<AuthHeader hideLogo={true} />

			<Stack
				backgroundColor={theme.palette.primary.main}
				sx={{
					borderRadius: theme.spacing(8),
					boxShadow: theme.palette.tertiary.cardShadow,
					margin: "auto",
					alignItems: "center",
					gap: theme.spacing(10),
					padding: theme.spacing(20),
					zIndex: 1,
					position: "relative",
					width: {
						sm: "60%",
						md: "50%",
						lg: "40%",
						xl: "30%",
					},
				}}
			>
				<Box
					mb={theme.spacing(10)}
					mt={theme.spacing(5)}
				>
					<Box
						sx={{
							width: { xs: 60, sm: 80, md: 90 },
						}}
					/>
					<Logo style={{ width: "100%", height: "100%" }} />
				</Box>
				<Stack
					mb={theme.spacing(12)}
					textAlign="center"
				>
					<Typography
						variant="h1"
						mb={theme.spacing(2)}
					>
						{t("auth.login.welcome")}
					</Typography>
					<Typography variant="h1">{t("auth.login.heading")}</Typography>
				</Stack>
				<Stack
					component="form"
					width="100%"
					padding={theme.spacing(8)}
					gap={theme.spacing(12)}
					onSubmit={onSubmit}
					sx={{
						width: {
							sm: "80%",
							md: "70%",
							lg: "65%",
							xl: "65%",
						},
					}}
				>
					<TextInput
						type="email"
						name="email"
						label={t("auth.common.inputs.email.label")}
						placeholder={t("auth.common.inputs.email.placeholder")}
						autoComplete="email"
						value={form.email}
						onChange={onChange}
						error={errors.email ? true : false}
						helperText={errors.email ? t(errors.email) : ""} // Localization keys are in validation.js
					/>
					<TextInput
						type="password"
						name="password"
						label={t("auth.common.inputs.password.label")}
						placeholder="••••••••••"
						autoComplete="current-password"
						value={form.password}
						onChange={onChange}
						error={errors.password ? true : false}
						helperText={errors.password ? t(errors.password) : ""} // Localization keys are in validation.js
						endAdornment={<PasswordEndAdornment />}
					/>
					<Button
						variant="contained"
						color="accent"
						type="submit"
						sx={{ width: "100%", alignSelf: "center", fontWeight: 700 }}
					>
						Login
					</Button>
				</Stack>
				<TextLink
					text={t("auth.login.links.forgotPassword")}
					linkText={t("auth.login.links.forgotPasswordLink")}
					href="/forgot-password"
				/>
				<TextLink
					text={t("auth.login.links.register")}
					linkText={t("auth.login.links.registerLink")}
					href="/register"
				/>
			</Stack>
		</Stack>
	);
};

export default Login;
