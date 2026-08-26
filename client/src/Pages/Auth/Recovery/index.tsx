import { Button } from "@/Components/inputs";
import { BaseAuthPage, TextLink } from "@/Components/design-elements";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { useRecoveryForm } from "@/Hooks/useRecoveryForm";
import type { RecoveryFormData } from "@/Validation/recovery";
import { usePost } from "@/Hooks/UseApi";
import { useTranslation } from "react-i18next";
import { FormTextField } from "@/Components/inputs/forms/FormTextField";

const ForgotPasswordPage = () => {
	const { t } = useTranslation();
	const { post, loading } = usePost();

	const { schema, defaults } = useRecoveryForm();

	const form = useForm<RecoveryFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});
	const { handleSubmit } = form;

	const onSubmit = async (data: RecoveryFormData) => {
		if (loading) return;

		const result = await post("/auth/recovery/request", data);

		if (result?.success) {
			// Navigate to Check email page
		}
	};

	return (
		<FormProvider {...form}>
			<BaseAuthPage
				component="form"
				onSubmit={handleSubmit(onSubmit)}
				title={t("pages.auth.forgotPassword.title")}
				subtitle={t("pages.auth.forgotPassword.subtitle")}
			>
				<FormTextField
					name="email"
					fieldLabel={t("pages.auth.common.form.option.email.label")}
					placeholder={t("pages.auth.common.form.option.email.placeholder")}
				/>
				<Button
					variant="contained"
					type="submit"
					loading={loading}
				>
					{t("pages.auth.forgotPassword.submit")}
				</Button>
				<TextLink
					alignSelf={"center"}
					text={t("pages.auth.forgotPassword.links.login.text")}
					linkText={t("pages.auth.forgotPassword.links.login.linkText")}
					href="/login"
				/>
			</BaseAuthPage>
		</FormProvider>
	);
};

export default ForgotPasswordPage;
