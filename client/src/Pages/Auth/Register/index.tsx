import { BaseAuthPage } from "@/Components/design-elements";
import { Button } from "@/Components/inputs";
import Alert from "@mui/material/Alert";
import { useForm, FormProvider } from "react-hook-form";
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
import { FormTextField } from "@/Components/inputs/forms/FormTextField";

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

	const form = useForm<RegisterFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});
	const { handleSubmit, setError, reset } = form;

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
	}, [token, defaults, navigate, reset, verifyToken]);

	if (isCheckingAdmin) return null;

	const onSubmit = async (data: RegisterFormData) => {
		if (loading) return;

		const { confirm: _confirm, ...userData } = data;
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
		<FormProvider {...form}>
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
				<FormTextField
					name="firstName"
					fieldLabel={t("common.form.name.option.firstName.label")}
					placeholder={t("common.form.name.option.firstName.placeholder")}
				/>
				<FormTextField
					name="lastName"
					fieldLabel={t("common.form.name.option.lastName.label")}
					placeholder={t("common.form.name.option.lastName.placeholder")}
				/>
				<FormTextField
					name="email"
					type="email"
					disabled={!!token}
					fieldLabel={t("common.form.email.option.email.label")}
					placeholder={t("common.form.email.option.email.placeholder")}
				/>

				<FormTextField
					name="password"
					type="password"
					fieldLabel={t("pages.auth.common.form.option.password.label")}
					placeholder={t("pages.auth.common.form.option.password.placeholder")}
				/>

				<FormTextField
					name="confirm"
					type="password"
					fieldLabel={t("pages.auth.common.form.option.confirmPassword.label")}
					placeholder={t("pages.auth.common.form.option.password.placeholder")}
				/>

				<Button
					variant="contained"
					type="submit"
					loading={loading}
				>
					{t("pages.auth.register.submit")}
				</Button>
			</BaseAuthPage>
		</FormProvider>
	);
};

export default RegisterPage;
