import { BaseAuthPage, BulletPointCheck, TextLink } from "@/Components/design-elements";
import { Button, TextField } from "@/Components/inputs";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { useSetNewPasswordForm } from "@/Hooks/useSetNewPasswordForm";
import type { SetNewPasswordFormData } from "@/Validation/setNewPassword";
import { specialCharPattern } from "@/Validation/patterns";
import { useParams, useNavigate } from "react-router-dom";
import { usePost } from "@/Hooks/UseApi";
import { useDispatch } from "react-redux";
import { setAuthState } from "@/Features/Auth/authSlice";

const SetNewPasswordPage = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { token } = useParams<{ token: string }>();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { post, loading } = usePost();

	const { schema, defaults } = useSetNewPasswordForm();

	const { control, handleSubmit, watch } = useForm<SetNewPasswordFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});

	const password = watch("password");
	const confirm = watch("confirm");

	const getVariant = (condition: boolean): "success" | "info" => {
		return condition ? "success" : "info";
	};

	const hasLength = password.length >= 8;
	const hasSpecial = specialCharPattern.test(password);
	const hasNumber = /\d/.test(password);
	const hasUppercase = /[A-Z]/.test(password);
	const hasLowercase = /[a-z]/.test(password);
	const passwordsMatch = password.length > 0 && password === confirm;

	const onSubmit = async (data: SetNewPasswordFormData) => {
		if (loading) return;

		const result = await post("/auth/recovery/reset", {
			password: data.password,
			recoveryToken: token,
		});

		if (result?.success) {
			dispatch(setAuthState(result));
			navigate("/uptime");
		}
	};

	return (
		<BaseAuthPage
			component="form"
			onSubmit={handleSubmit(onSubmit)}
			title={t("pages.auth.setNewPassword.title")}
			subtitle={t("pages.auth.setNewPassword.subtitle")}
		>
			<Controller
				name="password"
				control={control}
				render={({ field, fieldState }) => (
					<TextField
						{...field}
						type="password"
						fieldLabel={t("pages.auth.common.form.option.password.label")}
						placeholder={t("pages.auth.common.form.option.password.placeholder")}
						error={!!fieldState.error}
						helperText={fieldState.error?.message ?? ""}
					/>
				)}
			/>
			<Controller
				name="confirm"
				control={control}
				render={({ field, fieldState }) => (
					<TextField
						{...field}
						type="password"
						fieldLabel={t("pages.auth.common.form.option.confirmPassword.label")}
						placeholder={t("pages.auth.common.form.option.password.placeholder")}
						error={!!fieldState.error}
						helperText={fieldState.error?.message ?? ""}
					/>
				)}
			/>
			<Stack gap={theme.spacing(4)}>
				<BulletPointCheck
					text={t("pages.auth.common.passwordRules.length")}
					variant={getVariant(hasLength)}
				/>
				<BulletPointCheck
					text={t("pages.auth.common.passwordRules.special")}
					variant={getVariant(hasSpecial)}
				/>
				<BulletPointCheck
					text={t("pages.auth.common.passwordRules.number")}
					variant={getVariant(hasNumber)}
				/>
				<BulletPointCheck
					text={t("pages.auth.common.passwordRules.uppercase")}
					variant={getVariant(hasUppercase)}
				/>
				<BulletPointCheck
					text={t("pages.auth.common.passwordRules.lowercase")}
					variant={getVariant(hasLowercase)}
				/>
				<BulletPointCheck
					text={t("pages.auth.common.passwordRules.match")}
					variant={getVariant(passwordsMatch)}
				/>
			</Stack>
			<Button
				variant="contained"
				type="submit"
				fullWidth
				loading={loading}
			>
				{t("common.buttons.resetPassword")}
			</Button>
			<TextLink
				alignSelf="center"
				text={t("pages.auth.forgotPassword.links.login.text")}
				linkText={t("pages.auth.forgotPassword.links.login.linkText")}
				href="/login"
			/>
		</BaseAuthPage>
	);
};

export default SetNewPasswordPage;
