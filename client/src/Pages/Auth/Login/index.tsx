import { BaseAuthPage, TextLink } from "@/Components/design-elements";
import { Button } from "@/Components/inputs";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { useLoginForm } from "@/Hooks/useLoginForm";
import type { LoginFormData } from "@/Validation/login";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setAuthState } from "@/Features/Auth/authSlice";
import { useLazyGet, usePost } from "@/Hooks/UseApi";
import { FormTextField } from "@/Components/inputs/forms/FormTextField";

const LoginPage = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { post, loading } = usePost();

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

	if (isCheckingAdmin) return null;

	const onSubmit = async (data: LoginFormData) => {
		if (loading) return;

		const result = await post("/auth/login", data);

		if (result?.success) {
			dispatch(setAuthState(result));
			navigate("/uptime");
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
			</BaseAuthPage>
		</FormProvider>
	);
};

export default LoginPage;
