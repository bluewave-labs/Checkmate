import { BaseAuthPage, TextLink } from "@/Components/design-elements";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { useRecoveryForm } from "@/Hooks/useRecoveryForm";
import type { RecoveryFormData } from "@/Validation/recovery";
import { useTranslation } from "react-i18next";

const ForgotPasswordPage = () => {
	const { t } = useTranslation();

	const { schema, defaults } = useRecoveryForm();

	const { handleSubmit } = useForm<RecoveryFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});

	const onSubmit = async ({/*data: RecoveryFormData*/}) => {
		{/* Disabled
		if (loading) return;

		const result = await post("/auth/recovery/request", data);

		if (result?.success) {
			// Navigate to Check email page
		}
		*/}
	};

	return (
		<BaseAuthPage
			component="form"
			onSubmit={handleSubmit(onSubmit)}
			title={t("pages.auth.forgotPassword.title")}
			subtitle={t("pages.auth.forgotPassword.subtitle")}
		>
			{/* Disabled
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
			*/}
			<TextLink
				alignSelf={"center"}
				text="Recovery is currently disabled. Please contact the administrator to reset your password."
				linkText="Go back to login"
				href="/login"
			/>
		</BaseAuthPage>
	);
};

export default ForgotPasswordPage;
