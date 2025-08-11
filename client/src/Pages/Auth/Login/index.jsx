// Components
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextInput from "../../../Components/Inputs/TextInput";
import { PasswordEndAdornment } from "../../../Components/Inputs/TextInput/Adornments";
import TextLink from "../../../Components/TextLink";
import AuthPageWrapper from "../components/AuthPageWrapper";
// Utils
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import useLoginForm from "../hooks/useLoginForm";
import useValidateLoginForm from "../hooks/useValidateLoginForm";
import useLoginSubmit from "../hooks/useLoginSubmit";
import useLoadingSubmit from "../hooks/useLoadingSubmit";

const Login = () => {
	// Hooks
	const { t } = useTranslation();
	const theme = useTheme();
	const [form, onChange] = useLoginForm();
	const [errors, setErrors, validateField, validateForm] = useValidateLoginForm();
	const [handleLoginSubmit] = useLoginSubmit();
	const { submitting, executeSubmit } = useLoadingSubmit();

	// Handlers
	const handleChange = (e) => {
		onChange(e);
		validateField(e.target.name, e.target.value);
	};
	const onSubmit = async (e) => {
		e.preventDefault();
		const isValid = validateForm(form);
		if (!isValid) return;
		await executeSubmit(() => handleLoginSubmit(form, setErrors));
	};
	return (
		<AuthPageWrapper
			welcome={t("auth.login.welcome")}
			heading={t("auth.login.heading")}
		>
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
					onChange={handleChange}
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
					onChange={handleChange}
					error={errors.password ? true : false}
					helperText={errors.password ? t(errors.password) : ""} // Localization keys are in validation.js
					endAdornment={<PasswordEndAdornment />}
				/>
				<Button
					variant="contained"
					color="accent"
					type="submit"
					sx={{ width: "100%", alignSelf: "center", fontWeight: 700 }}
					loading={submitting}
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
		</AuthPageWrapper>
	);
};
export default Login;
