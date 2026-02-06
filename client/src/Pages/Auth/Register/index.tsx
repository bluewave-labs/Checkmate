import { BaseAuthPage } from "@/Components/v2/design-elements";
import { Button, TextField } from "@/Components/v2/inputs";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { useRegisterForm } from "@/Hooks/useRegisterForm";
import type { RegisterFormData } from "@/Validation/register";
import { useTranslation } from "react-i18next";
import { usePost } from "@/Hooks/UseApi";
import { setAuthState } from "@/Features/Auth/authSlice";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import type { AuthResponse } from "@/Types/User";
import { useEffect, useRef } from "react";

interface RegisterPayload {
	user: Omit<RegisterFormData, "confirm">;
	token?: string;
}

interface InviteVerifyResponse {
	email: string;
}

const RegisterPage = () => {
	const { t } = useTranslation();
	const { schema, defaults } = useRegisterForm();
	const { post, loading } = usePost<RegisterPayload, AuthResponse>();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { token } = useParams<{ token?: string }>();

	const { post: verifyToken } = usePost<{ token: string }, InviteVerifyResponse>();
	const hasVerified = useRef(false);

	const { control, handleSubmit, setError, reset } = useForm<RegisterFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});

	useEffect(() => {
		if (!token || hasVerified.current) return;
		hasVerified.current = true;

		verifyToken("/invite/verify", { token }).then((result) => {
			if (result?.success && result?.data) {
				reset({
					...defaults,
					email: result.data.email ?? "",
				});
			} else {
				navigate("/register", { replace: true });
			}
		});
	}, [token]);

	const onSubmit = async (data: RegisterFormData) => {
		if (loading) return;

		const { confirm, ...userData } = data;
		const payload: RegisterPayload = { user: userData };
		if (token) {
			payload.token = token;
		}
		const result = await post("/auth/register", payload);

		if (result?.success) {
			dispatch(setAuthState(result));
			navigate("/uptime");
		} else if (result?.msg) {
			if (result.msg.toLowerCase().includes("email")) {
				setError("email", { message: result.msg });
			}
		}
	};

	return (
		<BaseAuthPage
			component="form"
			onSubmit={handleSubmit(onSubmit)}
			title={t("pages.auth.register.title")}
			subtitle={t("pages.auth.register.subtitle")}
		>
			<Controller
				name="firstName"
				control={control}
				render={({ field, fieldState }) => (
					<TextField
						{...field}
						fieldLabel={t("pages.auth.register.form.option.name.label")}
						placeholder={t("pages.auth.register.form.option.name.placeholder")}
						error={!!fieldState.error}
						helperText={fieldState.error?.message ?? ""}
					/>
				)}
			/>
			<Controller
				name="lastName"
				control={control}
				render={({ field, fieldState }) => (
					<TextField
						{...field}
						fieldLabel={t("pages.auth.register.form.option.surname.label")}
						placeholder={t("pages.auth.register.form.option.surname.placeholder")}
						error={!!fieldState.error}
						helperText={fieldState.error?.message ?? ""}
					/>
				)}
			/>
			<Controller
				name="email"
				control={control}
				render={({ field, fieldState }) => (
					<TextField
						{...field}
						disabled={!!token}
						fieldLabel={t("pages.auth.common.form.option.email.label")}
						placeholder={t("pages.auth.common.form.option.email.placeholder")}
						error={!!fieldState.error}
						helperText={fieldState.error?.message ?? ""}
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
			<Button
				variant="contained"
				type="submit"
				loading={loading}
			>
				{t("pages.auth.register.submit")}
			</Button>
		</BaseAuthPage>
	);
};

export default RegisterPage;
