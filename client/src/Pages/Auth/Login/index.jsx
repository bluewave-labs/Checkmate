// Components
import Stack from "@mui/material/Stack";
import AuthHeader from "../components/AuthHeader";
import Button from "@mui/material/Button";
import TextInput from "../../../Components/Inputs/TextInput";
import { PasswordEndAdornment } from "../../../Components/Inputs/TextInput/Adornments";
import { loginCredentials } from "../../../Validation/validation";
import TextLink from "../components/TextLink";

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
		const { name, value } = e.target;
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
			height="100vh"
		>
			<AuthHeader />
			<Stack
				margin="auto"
				width="100%"
				alignItems="center"
				gap={theme.spacing(10)}
			>
				<Stack
					component="form"
					width="100%"
					maxWidth={600}
					alignSelf="center"
					justifyContent="center"
					border={1}
					borderRadius={theme.spacing(5)}
					borderColor={theme.palette.primary.lowContrast}
					backgroundColor={theme.palette.primary.main}
					padding={theme.spacing(12)}
					gap={theme.spacing(12)}
					onSubmit={onSubmit}
				>
					<TextInput
						type="email"
						name="email"
						label={t("auth.common.inputs.email.label")}
						isRequired={true}
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
						isRequired={true}
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
						sx={{ width: "30%", alignSelf: "flex-end" }}
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
