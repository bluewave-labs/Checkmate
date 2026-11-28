import { TextLink } from "@/Components/design-elements";
import { BaseAuthPage } from "@/Pages/Auth/components/BaseAuthPage";
import { Button } from "@/Components/inputs";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { useLoginForm } from "@/Hooks/useLoginForm";
import type { LoginFormData } from "@/Validation/login";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { LAYOUT } from "@/Utils/Theme/constants";
import { SSO_STATE_KEY, useSsoStatus } from "@/Hooks/useSsoStatus";
import { setAuthState } from "@/Features/Auth/authSlice";
import { useLazyGet, usePost } from "@/Hooks/UseApi";
import { FormTextField } from "@/Components/inputs/forms/FormTextField";

const LoginPage = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const theme = useTheme();
	const { post, loading } = usePost();
	const { post: postSsoStart, loading: ssoLoading } = usePost<
		{ returnOrigin: string },
		{ redirectUrl: string; state: string }
	>();
	const { status: ssoStatus, isLoading: isLoadingSso } = useSsoStatus();
	const [searchParams] = useSearchParams();

	const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
	const { get } = useLazyGet<boolean>();

	useEffect(() => {
		get("/auth/users/superadmin").then((res) => {
			if (res?.data === false) navigate("/register", { replace: true });
			else setIsCheckingAdmin(false);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const { schema, defaults } = useLoginForm();

	const form = useForm<LoginFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});

	const { handleSubmit } = form;

	if (isCheckingAdmin || isLoadingSso) return null;

	const ssoProvider = ssoStatus?.enabled ? ssoStatus.provider : null;
	// Under enforce the email form stays hidden until the user follows the password link
	const showPasswordForm =
		!ssoProvider || !ssoStatus?.enforce || searchParams.has("password");

	const onSsoClick = async () => {
		if (ssoLoading) return;

		const result = await postSsoStart("/sso/start", {
			returnOrigin: window.location.origin,
		});

		if (result?.success) {
			sessionStorage.setItem(SSO_STATE_KEY, result.data.state);
			window.location.assign(result.data.redirectUrl);
		}
	};

	const onSubmit = async (data: LoginFormData) => {
		if (loading) return;

		const result = await post("/auth/login", data);

		if (result?.success) {
			dispatch(setAuthState(result));
			navigate("/dashboard");
		}
	};

	return (
		<FormProvider {...form}>
			<BaseAuthPage
				component="form"
				onSubmit={handleSubmit(onSubmit)}
				title={t("pages.auth.login.title")}
				subtitle={t("pages.auth.login.subtitle")}
			>
				{ssoProvider && (
					<Button
						type="button"
						variant="outlined"
						color="secondary"
						fullWidth
						loading={ssoLoading}
						onClick={onSsoClick}
					>
						{t(`pages.auth.sso.button.${ssoProvider}`)}
					</Button>
				)}
				{ssoProvider && showPasswordForm && (
					<Stack
						direction="row"
						alignItems="center"
						gap={theme.spacing(LAYOUT.XS)}
					>
						<Box flex={1}>
							<Divider />
						</Box>
						<Typography color={theme.palette.text.secondary}>
							{t("pages.auth.sso.or")}
						</Typography>
						<Box flex={1}>
							<Divider />
						</Box>
					</Stack>
				)}
				{ssoProvider && !showPasswordForm && (
					<TextLink
						alignSelf={"center"}
						gap={0}
						text=""
						linkText={t("pages.auth.sso.passwordLink")}
						href="/login?password"
					/>
				)}
				{showPasswordForm && (
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
						<TextLink
							alignSelf={"center"}
							text={t("pages.auth.login.links.forgotPassword.text")}
							linkText={t("pages.auth.login.links.forgotPassword.linkText")}
							href="/forgot-password"
						/>
					</>
				)}
			</BaseAuthPage>
		</FormProvider>
	);
};

export default LoginPage;
