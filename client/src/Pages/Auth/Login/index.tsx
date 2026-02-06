import { BaseAuthPage } from "@/Components/v2/design-elements";
import { Button, TextField } from "@/Components/v2/inputs";

import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { useLoginForm } from "@/Hooks/useLoginForm";
import type { LoginFormData } from "@/Validation/login";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setAuthState } from "@/Features/Auth/authSlice";
import { usePost } from "@/Hooks/UseApi";

const LoginPage = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { post, loading } = usePost();

	const { schema, defaults } = useLoginForm();

	const { control, handleSubmit, setError } = useForm<LoginFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});

	const onSubmit = async (data: LoginFormData) => {
		if (loading) return;

		const result = await post("/auth/login", data);

		if (result?.success) {
			console.log(result);
			// dispatch(setAuthState(result));
			// navigate("/uptime");
		} else if (result?.msg === "Incorrect password") {
			setError("password", {
				message: "auth.login.errors.password.incorrect",
			});
		}
	};

	return (
		<BaseAuthPage
			component="form"
			onSubmit={handleSubmit(onSubmit)}
			title={t("pages.auth.login.title")}
			subtitle={t("pages.auth.login.subtitle")}
		>
			<Controller
				name="email"
				control={control}
				render={({ field, fieldState }) => (
					<TextField
						{...field}
						fieldLabel={t("pages.auth.common.form.option.email.label")}
						placeholder={t("pages.auth.common.form.option.email.placeholder")}
						error={!!fieldState.error}
						helperText={fieldState.error ? t(fieldState.error.message ?? "") : ""}
					/>
				)}
			/>
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
						helperText={fieldState.error ? t(fieldState.error.message ?? "") : ""}
					/>
				)}
			/>
			<Button
				variant="contained"
				type="submit"
				loading={loading}
			>
				{t("pages.auth.login.submit")}
			</Button>
		</BaseAuthPage>
	);
};

export default LoginPage;
