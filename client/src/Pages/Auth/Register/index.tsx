import { BaseAuthPage } from "@/Components/design-elements";
import { Button, TextField } from "@/Components/inputs";
import Alert from "@mui/material/Alert";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { useRegisterForm } from "@/Hooks/useRegisterForm";
import type { RegisterFormData } from "@/Validation/register";
import { useTranslation } from "react-i18next";
import { useLazyGet, usePost } from "@/Hooks/UseApi";
import { setAuthState } from "@/Features/Auth/authSlice";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import type { AuthResponse } from "@/Types/User";
import { useEffect, useRef, useState } from "react";

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

	const [isCheckingAdmin, setIsCheckingAdmin] = useState(!token);
	const { get } = useLazyGet<boolean>();

	useEffect(() => {
		if (token) return;
		get("/auth/users/superadmin").then((res) => {
			if (res?.data === true) navigate("/login", { replace: true });
			else setIsCheckingAdmin(false);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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

	if (isCheckingAdmin) return null;

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
			{!token && (
				<Alert
					severity="info"
					icon={false}
					sx={(theme) => ({
						fontSize: 13,
						lineHeight: 1.55,
						color: theme.palette.text.secondary,
						backgroundColor: theme.palette.action.hover,
						border: `1px solid ${theme.palette.divider}`,
						borderRadius: 1,
						"& .MuiAlert-message": { padding: 0 },
					})}
				>
					{t("pages.auth.register.setupNotice")}
				</Alert>
			)}
			<Controller
				name="firstName"
				control={control}
				render={({ field, fieldState }) => (
					<TextField
						{...field}
						fieldLabel={t("common.form.name.option.firstName.label")}
						placeholder={t("common.form.name.option.firstName.placeholder")}
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
						fieldLabel={t("common.form.name.option.lastName.label")}
						placeholder={t("common.form.name.option.lastName.placeholder")}
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
						fieldLabel={t("common.form.email.option.email.label")}
						placeholder={t("common.form.email.option.email.placeholder")}
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
