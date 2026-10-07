import { BaseAuthPage, TextLink } from "@/Components/design-elements";
import { Button } from "@/Components/inputs";
import { Divider, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { useLoginForm } from "@/Hooks/useLoginForm";
import type { LoginFormData } from "@/Validation/login";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setAuthState } from "@/Features/Auth/authSlice";
import { useLazyGet, usePost } from "@/Hooks/UseApi";
import { useToast } from "@/Hooks/UseToast";
import { FormTextField } from "@/Components/inputs/forms/FormTextField";
import { ssoStartUrl, type SsoConfig } from "@/Utils/sso";

const LoginPage = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { post, loading } = usePost();
	const { toastError } = useToast();
	const [searchParams] = useSearchParams();

	const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
	const [sso, setSso] = useState<SsoConfig | null>(null);
	const { get } = useLazyGet<boolean>();
	const { get: getSso } = useLazyGet<SsoConfig>();

	// Folded into the bootstrap probe the page already makes, so the SSO button costs no extra
	// round trip before first paint.
	useEffect(() => {
		Promise.all([get("/auth/users/superadmin"), getSso("/auth/sso")]).then(
			([admin, ssoConfig]) => {
				if (admin?.data === false) {
					navigate("/register", { replace: true });
					return;
				}
				setSso(ssoConfig?.data ?? null);
				setIsCheckingAdmin(false);
			}
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// The callback redirects here with a code rather than a message, so the provider can never put
	// text on this page. i18next falls back to the generic string for a code with no translation.
	const ssoError = searchParams.get("sso_error");
	useEffect(() => {
		if (!ssoError) return;
		toastError(
			t(
				[
					`pages.auth.login.sso.errors.${ssoError}`,
					"pages.auth.login.sso.errors.generic",
				],
				{
					defaultValue: t("pages.auth.login.sso.errors.generic"),
				}
			)
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ssoError]);

	const { schema, defaults } = useLoginForm();

	const form = useForm<LoginFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});

	const { handleSubmit } = form;

	if (isCheckingAdmin) return null;

	const onSubmit = async (data: LoginFormData) => {
		if (loading) return;

		const result = await post("/auth/login", data);

		if (result?.success) {
			dispatch(setAuthState(result));
			navigate("/uptime");
		}
	};

	const ssoEnabled = sso?.enabled === true;
	const localLoginEnabled = sso?.localLoginDisabled !== true;

	return (
		<FormProvider {...form}>
			<BaseAuthPage
				component="form"
				onSubmit={handleSubmit(onSubmit)}
				title={t("pages.auth.login.title")}
				subtitle={t("pages.auth.login.subtitle")}
			>
				{localLoginEnabled && (
					<>
						<FormTextField
							name="email"
							fieldLabel={t("pages.auth.common.form.option.email.label")}
							placeholder={t("pages.auth.common.form.option.email.placeholder")}
						/>
						<FormTextField
							name="password"
							type="password"
							fieldLabel={t("pages.auth.common.form.option.password.label")}
							placeholder={t("pages.auth.common.form.option.password.placeholder")}
						/>
						<Button
							variant="contained"
							type="submit"
							loading={loading}
						>
							{t("pages.auth.login.submit")}
						</Button>
					</>
				)}
				{ssoEnabled && localLoginEnabled && (
					<Divider>
						<Typography color={theme.palette.text.secondary}>
							{t("pages.auth.login.sso.divider")}
						</Typography>
					</Divider>
				)}
				{ssoEnabled && (
					<Button
						variant="outlined"
						/* Not "submit": this button lives inside the login form, and the default would post it. */
						type="button"
						onClick={() => window.location.assign(ssoStartUrl())}
					>
						{sso?.label || t("pages.auth.login.sso.submit")}
					</Button>
				)}
				{localLoginEnabled && (
					<TextLink
						alignSelf={"center"}
						text={t("pages.auth.login.links.forgotPassword.text")}
						linkText={t("pages.auth.login.links.forgotPassword.linkText")}
						href="/forgot-password"
					/>
				)}
			</BaseAuthPage>
		</FormProvider>
	);
};

export default LoginPage;
